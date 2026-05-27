import asyncio
from concurrent.futures import ThreadPoolExecutor

from yahooquery import Ticker as YQTicker
import yfinance as yf
import httpx
from typing import Optional

from app.services.cache import cache

_executor = ThreadPoolExecutor(max_workers=10)


# Common currency pairs
MAJOR_PAIRS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF",
    "AUDUSD", "USDCAD", "NZDUSD", "EURGBP",
    "EURJPY", "GBPJPY",
]


def _fetch_forex_batch(symbols: list[str]) -> dict:
    """Batch fetch forex data via yahooquery."""
    t = YQTicker(" ".join(symbols))
    return t.price


async def get_forex_quote(base: str, quote: str) -> dict:
    """Get current exchange rate for a currency pair."""
    cache_key = f"forex:{base.upper()}{quote.upper()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    symbol = f"{base.upper()}{quote.upper()}=X"
    loop = asyncio.get_event_loop()
    price_data = await loop.run_in_executor(_executor, _fetch_forex_batch, [symbol])
    info = price_data.get(symbol, {})
    if isinstance(info, str):
        info = {}

    price = info.get("regularMarketPrice")
    prev_close = info.get("regularMarketPreviousClose")

    change = None
    change_pct = None
    if price and prev_close:
        change = round(price - prev_close, 6)
        change_pct = round((change / prev_close) * 100, 4)

    result = {
        "pair": f"{base.upper()}/{quote.upper()}",
        "price": price,
        "bid": None,
        "ask": None,
        "previous_close": prev_close,
        "change": change,
        "change_percent": change_pct,
        "day_high": info.get("regularMarketDayHigh"),
        "day_low": info.get("regularMarketDayLow"),
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
    }
    cache.set(cache_key, result, ttl_seconds=120)
    return result


async def get_forex_history(
    base: str, quote: str, period: str = "1mo", interval: str = "1d"
) -> list[dict]:
    """Get historical exchange rate data."""
    symbol = f"{base.upper()}{quote.upper()}=X"
    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(_executor, lambda: yf.Ticker(symbol).history(period=period, interval=interval))

    if df.empty:
        return []

    df = df.reset_index()
    records = []
    for _, row in df.iterrows():
        date_val = row.get("Date", row.get("Datetime"))
        records.append({
            "date": str(date_val),
            "open": round(float(row["Open"]), 6),
            "high": round(float(row["High"]), 6),
            "low": round(float(row["Low"]), 6),
            "close": round(float(row["Close"]), 6),
            "volume": int(row["Volume"]) if row["Volume"] else 0,
        })

    return records


async def get_major_pairs() -> list[dict]:
    """Get quotes for all major currency pairs."""
    cached = cache.get("forex_majors")
    if cached:
        return cached

    # Single batch request for all pairs
    symbols = [f"{p[:3]}{p[3:]}=X" for p in MAJOR_PAIRS]
    loop = asyncio.get_event_loop()
    price_data = await loop.run_in_executor(_executor, _fetch_forex_batch, symbols)

    output = []
    for pair in MAJOR_PAIRS:
        base = pair[:3]
        quote_cur = pair[3:]
        symbol = f"{base}{quote_cur}=X"
        try:
            info = price_data.get(symbol, {})
            if isinstance(info, str):
                output.append({"pair": f"{base}/{quote_cur}", "error": "Failed to fetch"})
                continue
            price = info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose")
            change = round(price - prev, 6) if price and prev else None
            change_pct = round((change / prev) * 100, 4) if change and prev else None
            output.append({
                "pair": f"{base}/{quote_cur}",
                "price": price,
                "previous_close": prev,
                "change": change,
                "change_percent": change_pct,
            })
        except Exception:
            output.append({"pair": f"{base}/{quote_cur}", "error": "Failed to fetch"})

    cache.set("forex_majors", output, ttl_seconds=120)
    return output


async def convert_currency(amount: float, from_cur: str, to_cur: str) -> dict:
    """Convert an amount between currencies."""
    quote = await get_forex_quote(from_cur, to_cur)
    rate = quote.get("price")

    if rate is None:
        return {"error": "Could not fetch exchange rate"}

    converted = round(amount * rate, 4)
    return {
        "from": from_cur.upper(),
        "to": to_cur.upper(),
        "amount": amount,
        "rate": rate,
        "converted": converted,
    }
