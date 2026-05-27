from fastapi import APIRouter, Query, HTTPException

from app.services import forex

router = APIRouter(prefix="/api/forex", tags=["Forex"])


@router.get("/quote/{base}/{quote_currency}")
async def quote(base: str, quote_currency: str):
    """Get current exchange rate for a currency pair."""
    try:
        return await forex.get_forex_quote(base, quote_currency)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history/{base}/{quote_currency}")
async def history(
    base: str,
    quote_currency: str,
    period: str = Query("1mo", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y"),
    interval: str = Query("1d", description="Interval: 1h, 1d, 1wk"),
):
    """Get historical exchange rate data."""
    try:
        data = await forex.get_forex_history(base, quote_currency, period=period, interval=interval)
        return {"pair": f"{base.upper()}/{quote_currency.upper()}", "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/majors")
async def major_pairs():
    """Get quotes for all major currency pairs."""
    try:
        return await forex.get_major_pairs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/convert")
async def convert(
    amount: float = Query(..., description="Amount to convert"),
    from_cur: str = Query(..., description="Source currency code"),
    to_cur: str = Query(..., description="Target currency code"),
):
    """Convert between currencies."""
    try:
        return await forex.convert_currency(amount, from_cur, to_cur)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
