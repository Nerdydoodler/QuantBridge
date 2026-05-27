from fastapi import APIRouter, Query, HTTPException

from app.services import crypto

router = APIRouter(prefix="/api/crypto", tags=["Cryptocurrency"])


@router.get("/prices")
async def prices(
    ids: str = Query("bitcoin,ethereum,solana,cardano,polkadot", description="Comma-separated coin IDs"),
    vs_currency: str = Query("usd", description="Target currency"),
):
    """Get current cryptocurrency prices."""
    try:
        return await crypto.get_crypto_prices(ids=ids, vs_currency=vs_currency)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{coin_id}")
async def history(
    coin_id: str,
    days: int = Query(30, description="Number of days of history"),
    vs_currency: str = Query("usd"),
):
    """Get historical price data for a cryptocurrency."""
    try:
        data = await crypto.get_crypto_history(coin_id, days=days, vs_currency=vs_currency)
        return {"coin_id": coin_id, "days": days, "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/trending")
async def trending():
    """Get trending cryptocurrencies."""
    try:
        return await crypto.get_trending_crypto()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search(q: str = Query(..., description="Search query")):
    """Search for cryptocurrencies."""
    try:
        return await crypto.search_crypto(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
