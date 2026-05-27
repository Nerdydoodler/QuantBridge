from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import asyncio

from app.services import stocks, forex
from app.services.cache import cache

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Visualization"])


@router.get("/series")
async def get_series_data(
    symbols: str = Query(..., description="Comma-separated symbols (e.g., AAPL,MSFT,^GSPC,EURUSD=X)"),
    period: str = Query("1y", description="Period: 1mo,3mo,6mo,1y,2y,5y,max"),
    interval: str = Query("1d", description="Interval: 1d,1wk,1mo"),
):
    """Fetch historical data for multiple symbols for cross-referencing."""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(status_code=400, detail="Provide at least one symbol")
    if len(symbol_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 series at once")

    cache_key = f"analytics:{','.join(symbol_list)}:{period}:{interval}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    async def fetch_one(symbol):
        try:
            data = await stocks.get_historical(symbol, period=period, interval=interval)
            return {"symbol": symbol, "data": data, "error": None}
        except Exception as e:
            return {"symbol": symbol, "data": [], "error": str(e)}

    results = await asyncio.gather(*[fetch_one(s) for s in symbol_list])
    output = {"series": list(results), "period": period, "interval": interval}
    cache.set(cache_key, output, ttl_seconds=300)
    return output


@router.get("/compare")
async def compare_normalized(
    symbols: str = Query(..., description="Comma-separated symbols"),
    period: str = Query("1y"),
    interval: str = Query("1d"),
):
    """Fetch and normalize data for percentage-change comparison."""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list or len(symbol_list) > 10:
        raise HTTPException(status_code=400, detail="Provide 1-10 symbols")

    cache_key = f"compare:{','.join(symbol_list)}:{period}:{interval}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    async def fetch_one(symbol):
        try:
            data = await stocks.get_historical(symbol, period=period, interval=interval)
            if not data:
                return {"symbol": symbol, "data": [], "error": "No data"}
            base = data[0]["close"]
            normalized = [
                {"date": pt["date"], "value": round(((pt["close"] - base) / base) * 100, 4)}
                for pt in data if pt.get("close") and base
            ]
            return {"symbol": symbol, "data": normalized, "base_price": base, "error": None}
        except Exception as e:
            return {"symbol": symbol, "data": [], "error": str(e)}

    results = await asyncio.gather(*[fetch_one(s) for s in symbol_list])
    output = {"series": list(results), "period": period, "interval": interval, "unit": "percent_change"}
    cache.set(cache_key, output, ttl_seconds=300)
    return output


@router.get("/symbols/suggest")
async def suggest_symbols(q: str = Query(..., min_length=1)):
    """Quick symbol suggestions for the series picker."""
    # Common indices and assets to always suggest
    popular = [
        {"symbol": "^GSPC", "name": "S&P 500", "type": "index"},
        {"symbol": "^DJI", "name": "Dow Jones", "type": "index"},
        {"symbol": "^IXIC", "name": "NASDAQ Composite", "type": "index"},
        {"symbol": "^RUT", "name": "Russell 2000", "type": "index"},
        {"symbol": "^VIX", "name": "VIX Volatility", "type": "index"},
        {"symbol": "^TNX", "name": "10Y Treasury Yield", "type": "bond"},
        {"symbol": "GC=F", "name": "Gold Futures", "type": "commodity"},
        {"symbol": "CL=F", "name": "Crude Oil WTI", "type": "commodity"},
        {"symbol": "SI=F", "name": "Silver Futures", "type": "commodity"},
        {"symbol": "BTC-USD", "name": "Bitcoin", "type": "crypto"},
        {"symbol": "ETH-USD", "name": "Ethereum", "type": "crypto"},
        {"symbol": "EURUSD=X", "name": "EUR/USD", "type": "forex"},
        {"symbol": "GBPUSD=X", "name": "GBP/USD", "type": "forex"},
        {"symbol": "USDJPY=X", "name": "USD/JPY", "type": "forex"},
        {"symbol": "XLK", "name": "Technology ETF", "type": "etf"},
        {"symbol": "XLF", "name": "Financials ETF", "type": "etf"},
        {"symbol": "XLE", "name": "Energy ETF", "type": "etf"},
        {"symbol": "XLV", "name": "Healthcare ETF", "type": "etf"},
        {"symbol": "SPY", "name": "S&P 500 ETF", "type": "etf"},
        {"symbol": "QQQ", "name": "NASDAQ 100 ETF", "type": "etf"},
        {"symbol": "IWM", "name": "Russell 2000 ETF", "type": "etf"},
        {"symbol": "TLT", "name": "20+ Year Treasury ETF", "type": "etf"},
        {"symbol": "DIA", "name": "Dow Jones ETF", "type": "etf"},
    ]

    q_lower = q.lower()
    matches = [s for s in popular if q_lower in s["symbol"].lower() or q_lower in s["name"].lower()]

    # Also search stocks
    try:
        stock_results = await stocks.search_symbols(q)
        for r in stock_results[:5]:
            matches.append({"symbol": r.get("symbol", ""), "name": r.get("name", ""), "type": "stock"})
    except Exception:
        pass

    # Deduplicate
    seen = set()
    unique = []
    for m in matches:
        if m["symbol"] not in seen:
            seen.add(m["symbol"])
            unique.append(m)

    return unique[:15]
