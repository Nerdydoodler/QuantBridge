from fastapi import APIRouter, Query, HTTPException

from app.services import news

router = APIRouter(prefix="/api/news", tags=["News"])


@router.get("/market")
async def market_news(limit: int = Query(50, ge=1, le=200)):
    """Get latest market news from multiple sources."""
    try:
        return await news.get_market_news(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock/{symbol}")
async def stock_news(symbol: str, limit: int = Query(10, ge=1, le=30)):
    """Get news for a specific stock symbol."""
    try:
        return await news.get_stock_news(symbol, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/crypto")
async def crypto_news(limit: int = Query(40, ge=1, le=100)):
    """Get cryptocurrency news."""
    try:
        return await news.get_crypto_news(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
