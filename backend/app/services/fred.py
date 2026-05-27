import httpx
from typing import Optional
from datetime import datetime, timedelta

from app.config import settings
from app.services.cache import cache

FRED_BASE = "https://api.stlouisfed.org/fred"

# Popular FRED series for quick access
POPULAR_SERIES = {
    "gdp": {"id": "GDP", "name": "Gross Domestic Product", "units": "Billions of Dollars", "frequency": "Quarterly"},
    "real_gdp": {"id": "GDPC1", "name": "Real GDP", "units": "Billions of Chained 2017 Dollars", "frequency": "Quarterly"},
    "unemployment": {"id": "UNRATE", "name": "Unemployment Rate", "units": "Percent", "frequency": "Monthly"},
    "cpi": {"id": "CPIAUCSL", "name": "Consumer Price Index (All Urban)", "units": "Index 1982-1984=100", "frequency": "Monthly"},
    "core_cpi": {"id": "CPILFESL", "name": "Core CPI (Less Food & Energy)", "units": "Index 1982-1984=100", "frequency": "Monthly"},
    "pce": {"id": "PCE", "name": "Personal Consumption Expenditures", "units": "Billions of Dollars", "frequency": "Monthly"},
    "core_pce": {"id": "PCEPILFE", "name": "Core PCE Price Index", "units": "Percent Change from Year Ago", "frequency": "Monthly"},
    "fed_funds": {"id": "FEDFUNDS", "name": "Federal Funds Effective Rate", "units": "Percent", "frequency": "Monthly"},
    "prime_rate": {"id": "DPRIME", "name": "Bank Prime Loan Rate", "units": "Percent", "frequency": "Monthly"},
    "treasury_10y": {"id": "DGS10", "name": "10-Year Treasury Constant Maturity", "units": "Percent", "frequency": "Daily"},
    "treasury_2y": {"id": "DGS2", "name": "2-Year Treasury Constant Maturity", "units": "Percent", "frequency": "Daily"},
    "treasury_30y": {"id": "DGS30", "name": "30-Year Treasury Constant Maturity", "units": "Percent", "frequency": "Daily"},
    "mortgage_30y": {"id": "MORTGAGE30US", "name": "30-Year Fixed Rate Mortgage Average", "units": "Percent", "frequency": "Weekly"},
    "industrial_production": {"id": "INDPRO", "name": "Industrial Production Index", "units": "Index 2017=100", "frequency": "Monthly"},
    "retail_sales": {"id": "RSAFS", "name": "Advance Retail Sales", "units": "Millions of Dollars", "frequency": "Monthly"},
    "housing_starts": {"id": "HOUST", "name": "Housing Starts", "units": "Thousands of Units", "frequency": "Monthly"},
    "consumer_sentiment": {"id": "UMCSENT", "name": "Consumer Sentiment (UMich)", "units": "Index 1966:Q1=100", "frequency": "Monthly"},
    "nonfarm_payrolls": {"id": "PAYEMS", "name": "Total Nonfarm Payrolls", "units": "Thousands of Persons", "frequency": "Monthly"},
    "m2_money": {"id": "M2SL", "name": "M2 Money Stock", "units": "Billions of Dollars", "frequency": "Monthly"},
    "sp500": {"id": "SP500", "name": "S&P 500 Index", "units": "Index", "frequency": "Daily"},
    "vix": {"id": "VIXCLS", "name": "CBOE Volatility Index (VIX)", "units": "Index", "frequency": "Daily"},
    "dollar_index": {"id": "DTWEXBGS", "name": "Trade Weighted U.S. Dollar Index", "units": "Index Jan 2006=100", "frequency": "Daily"},
    "initial_claims": {"id": "ICSA", "name": "Initial Jobless Claims", "units": "Number", "frequency": "Weekly"},
    "inflation_expectation": {"id": "T10YIE", "name": "10-Year Breakeven Inflation Rate", "units": "Percent", "frequency": "Daily"},
}


def _get_api_key() -> str:
    key = settings.ALPHA_VANTAGE_KEY  # reusing field, or check for FRED-specific
    fred_key = getattr(settings, "FRED_API_KEY", "") or ""
    return fred_key or key


async def get_series_data(
    series_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 500,
) -> dict:
    """Fetch observations for a FRED series."""
    api_key = _get_api_key()
    if not api_key:
        return {"error": "FRED_API_KEY not configured. Get one free at https://fred.stlouisfed.org/docs/api/api_key.html"}

    cache_key = f"fred:{series_id}:{start_date}:{end_date}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    if not start_date:
        start_date = (datetime.now() - timedelta(days=365 * 5)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Fetch series info
        info_resp = await client.get(
            f"{FRED_BASE}/series",
            params={"series_id": series_id, "api_key": api_key, "file_type": "json"},
        )

        # Fetch observations
        obs_resp = await client.get(
            f"{FRED_BASE}/series/observations",
            params={
                "series_id": series_id,
                "api_key": api_key,
                "file_type": "json",
                "observation_start": start_date,
                "observation_end": end_date,
                "sort_order": "desc",
                "limit": limit,
            },
        )

    if obs_resp.status_code != 200:
        return {"error": f"FRED API error: {obs_resp.status_code}", "detail": obs_resp.text[:200]}

    obs_data = obs_resp.json()
    observations = obs_data.get("observations", [])

    # Parse series info
    series_info = {}
    if info_resp.status_code == 200:
        serieses = info_resp.json().get("serieses", [])
        if serieses:
            s = serieses[0]
            series_info = {
                "id": s.get("id"),
                "title": s.get("title"),
                "units": s.get("units"),
                "frequency": s.get("frequency"),
                "seasonal_adjustment": s.get("seasonal_adjustment"),
                "last_updated": s.get("last_updated"),
            }

    # Parse observations
    data_points = []
    for obs in reversed(observations):
        value = obs.get("value")
        if value and value != ".":
            try:
                data_points.append({
                    "date": obs["date"],
                    "value": float(value),
                })
            except (ValueError, KeyError):
                continue

    result = {
        "series": series_info,
        "count": len(data_points),
        "data": data_points,
    }
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


async def search_series(query: str, limit: int = 20) -> list[dict]:
    """Search FRED for series matching a query."""
    api_key = _get_api_key()
    if not api_key:
        return [{"error": "FRED_API_KEY not configured"}]

    cache_key = f"fred_search:{query}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{FRED_BASE}/series/search",
            params={
                "search_text": query,
                "api_key": api_key,
                "file_type": "json",
                "limit": limit,
                "order_by": "popularity",
                "sort_order": "desc",
            },
        )

    if resp.status_code != 200:
        return [{"error": f"FRED API error: {resp.status_code}"}]

    data = resp.json()
    results = []
    for s in data.get("serieses", []):
        results.append({
            "id": s.get("id"),
            "title": s.get("title"),
            "units": s.get("units"),
            "frequency": s.get("frequency"),
            "popularity": s.get("popularity"),
            "last_updated": s.get("last_updated"),
            "observation_start": s.get("observation_start"),
            "observation_end": s.get("observation_end"),
        })

    cache.set(cache_key, results, ttl_seconds=3600)
    return results


async def get_popular_series() -> list[dict]:
    """Return list of popular/common FRED series."""
    return [{"key": k, **v} for k, v in POPULAR_SERIES.items()]


async def get_latest_values(series_ids: list[str]) -> list[dict]:
    """Fetch the latest value for multiple series at once."""
    api_key = _get_api_key()
    if not api_key:
        return [{"error": "FRED_API_KEY not configured"}]

    cache_key = f"fred_latest:{','.join(series_ids)}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    results = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for series_id in series_ids[:20]:
            try:
                resp = await client.get(
                    f"{FRED_BASE}/series/observations",
                    params={
                        "series_id": series_id,
                        "api_key": api_key,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 1,
                    },
                )
                if resp.status_code == 200:
                    obs = resp.json().get("observations", [])
                    if obs and obs[0].get("value") != ".":
                        results.append({
                            "series_id": series_id,
                            "date": obs[0]["date"],
                            "value": float(obs[0]["value"]),
                        })
                    else:
                        results.append({"series_id": series_id, "value": None})
            except Exception:
                results.append({"series_id": series_id, "error": "Failed to fetch"})

    cache.set(cache_key, results, ttl_seconds=600)
    return results
