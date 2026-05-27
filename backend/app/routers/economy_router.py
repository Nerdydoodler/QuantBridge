from fastapi import APIRouter, HTTPException

from app.services import economy

router = APIRouter(prefix="/api/economy", tags=["Economy"])


@router.get("/overview")
async def market_overview():
    """Get market overview with major indices."""
    try:
        return await economy.get_market_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def economic_calendar():
    """Get economic calendar events."""
    try:
        return await economy.get_economic_calendar()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/treasury")
async def treasury_rates():
    """Get US Treasury yield rates."""
    try:
        return await economy.get_treasury_rates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sectors")
async def sector_performance():
    """Get sector performance via ETFs."""
    try:
        return await economy.get_sector_performance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
