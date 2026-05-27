from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.services import stocks

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])


@router.get("/quote/{symbol}")
async def quote(symbol: str):
    """Get current quote for a stock symbol."""
    try:
        return await stocks.get_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not fetch quote for {symbol}: {str(e)}")


@router.get("/history/{symbol}")
async def history(
    symbol: str,
    period: str = Query("1y", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
    interval: str = Query("1d", description="Interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo"),
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """Get historical price data for a stock."""
    try:
        data = await stocks.get_historical(symbol, period=period, interval=interval, start=start, end=end)
        return {"symbol": symbol.upper(), "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/fundamentals/{symbol}")
async def fundamentals(symbol: str):
    """Get fundamental data for a stock."""
    try:
        return await stocks.get_fundamentals(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/financials/{symbol}/income")
async def income_statement(symbol: str, quarterly: bool = Query(False)):
    """Get income statement data."""
    try:
        data = await stocks.get_income_statement(symbol, quarterly=quarterly)
        return {"symbol": symbol.upper(), "quarterly": quarterly, "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/financials/{symbol}/balance")
async def balance_sheet(symbol: str, quarterly: bool = Query(False)):
    """Get balance sheet data."""
    try:
        data = await stocks.get_balance_sheet(symbol, quarterly=quarterly)
        return {"symbol": symbol.upper(), "quarterly": quarterly, "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/technicals/{symbol}")
async def technical_indicators(
    symbol: str,
    period: str = Query("1y", description="Historical period for calculations"),
):
    """Get technical analysis indicators for a stock."""
    try:
        prices = await stocks.get_historical(symbol, period=period)
        indicators = stocks.compute_technical_indicators(prices)
        return {"symbol": symbol.upper(), "indicators": indicators}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/search")
async def search(q: str = Query(..., description="Search query")):
    """Search for stock symbols."""
    try:
        results = await stocks.search_symbols(q)
        return {"query": q, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
