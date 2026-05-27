import asyncio
from concurrent.futures import ThreadPoolExecutor

import httpx
from yahooquery import Ticker as YQTicker
from typing import Optional

from app.services.cache import cache

_executor = ThreadPoolExecutor(max_workers=12)

# Economic data via FRED (Federal Reserve Economic Data) - public endpoints
FRED_BASE = "https://api.stlouisfed.org/fred"

# Major economic indicators (FRED series IDs)
ECONOMIC_SERIES = {
    "gdp": "GDP",
    "unemployment": "UNRATE",
    "inflation_cpi": "CPIAUCSL",
    "federal_funds_rate": "FEDFUNDS",
    "consumer_sentiment": "UMCSENT",
    "industrial_production": "INDPRO",
    "retail_sales": "RSAFS",
    "housing_starts": "HOUST",
    "pce": "PCE",
    "m2_money_supply": "M2SL",
    "treasury_10y": "DGS10",
    "treasury_2y": "DGS2",
    "sp500": "SP500",
    "vix": "VIXCLS",
}

# Market indices
INDICES = {
    "S&P 500": "^GSPC",
    "Dow Jones": "^DJI",
    "NASDAQ": "^IXIC",
    "Russell 2000": "^RUT",
    "VIX": "^VIX",
    "US 10Y Treasury": "^TNX",
    "US Dollar Index": "DX-Y.NYB",
    "Gold": "GC=F",
    "Oil (WTI)": "CL=F",
    "Bitcoin": "BTC-USD",
}


def _fetch_batch_prices(symbols: list[str]) -> dict:
    """Fetch multiple symbols at once via yahooquery (no rate limits)."""
    t = YQTicker(" ".join(symbols))
    return t.price


async def get_market_overview() -> list[dict]:
    """Get current values of major market indices."""
    cached = cache.get("market_overview")
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    symbols = list(INDICES.values())
    price_data = await loop.run_in_executor(_executor, _fetch_batch_prices, symbols)

    results = []
    for name, symbol in INDICES.items():
        try:
            info = price_data.get(symbol, {})
            if isinstance(info, str):
                results.append({"name": name, "symbol": symbol, "error": "Failed to fetch"})
                continue
            price = info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose")
            change = round(price - prev, 2) if price and prev else None
            change_pct = round((change / prev) * 100, 2) if change and prev else None
            results.append({"name": name, "symbol": symbol, "price": price, "change": change, "change_percent": change_pct})
        except Exception:
            results.append({"name": name, "symbol": symbol, "error": "Failed to fetch"})

    cache.set("market_overview", results, ttl_seconds=120)
    return results


async def get_economic_calendar() -> list[dict]:
    """Get upcoming economic events (simplified mock based on common releases)."""
    # This provides a static reference of typical economic events
    # In production, you'd integrate with an economic calendar API
    events = [
        {"event": "Non-Farm Payrolls", "frequency": "Monthly (First Friday)", "source": "BLS"},
        {"event": "CPI Report", "frequency": "Monthly", "source": "BLS"},
        {"event": "FOMC Meeting", "frequency": "8x per year", "source": "Federal Reserve"},
        {"event": "GDP Report", "frequency": "Quarterly", "source": "BEA"},
        {"event": "Retail Sales", "frequency": "Monthly", "source": "Census Bureau"},
        {"event": "Consumer Confidence", "frequency": "Monthly", "source": "Conference Board"},
        {"event": "PMI Manufacturing", "frequency": "Monthly", "source": "ISM"},
        {"event": "Jobless Claims", "frequency": "Weekly (Thursday)", "source": "DOL"},
        {"event": "Housing Starts", "frequency": "Monthly", "source": "Census Bureau"},
        {"event": "Industrial Production", "frequency": "Monthly", "source": "Federal Reserve"},
    ]
    return events


async def get_treasury_rates() -> dict:
    """Get current US Treasury yield curve rates."""
    cached = cache.get("treasury_rates")
    if cached:
        return cached

    maturities = {
        "1mo": "^IRX",
        "10y": "^TNX",
        "30y": "^TYX",
    }

    loop = asyncio.get_event_loop()
    symbols = list(maturities.values())
    price_data = await loop.run_in_executor(_executor, _fetch_batch_prices, symbols)

    rates = {}
    for label, symbol in maturities.items():
        try:
            info = price_data.get(symbol, {})
            if isinstance(info, str):
                rates[label] = None
            else:
                rates[label] = info.get("regularMarketPrice")
        except Exception:
            rates[label] = None

    result = {"rates": rates, "note": "Yields in percentage points"}
    cache.set("treasury_rates", result, ttl_seconds=300)
    return result


async def get_sector_performance() -> list[dict]:
    """Get performance of major market sectors via sector ETFs."""
    cached = cache.get("sector_performance")
    if cached:
        return cached

    sector_etfs = {
        "Technology": "XLK",
        "Healthcare": "XLV",
        "Financials": "XLF",
        "Consumer Discretionary": "XLY",
        "Consumer Staples": "XLP",
        "Energy": "XLE",
        "Utilities": "XLU",
        "Real Estate": "XLRE",
        "Materials": "XLB",
        "Industrials": "XLI",
        "Communication Services": "XLC",
    }

    loop = asyncio.get_event_loop()
    symbols = list(sector_etfs.values())
    price_data = await loop.run_in_executor(_executor, _fetch_batch_prices, symbols)

    results = []
    for sector, etf in sector_etfs.items():
        try:
            info = price_data.get(etf, {})
            if isinstance(info, str):
                results.append({"sector": sector, "etf": etf, "error": "Failed to fetch"})
                continue
            price = info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose")
            change_pct = round(((price - prev) / prev) * 100, 2) if price and prev else None
            results.append({"sector": sector, "etf": etf, "price": price, "change_percent": change_pct})
        except Exception:
            results.append({"sector": sector, "etf": etf, "error": "Failed to fetch"})

    results = sorted(results, key=lambda x: x.get("change_percent", 0) or 0, reverse=True)
    cache.set("sector_performance", results, ttl_seconds=120)
    return results
