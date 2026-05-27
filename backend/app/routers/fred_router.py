from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.services import fred

router = APIRouter(prefix="/api/fred", tags=["FRED Economic Data"])


@router.get("/series/{series_id}")
async def get_series(
    series_id: str,
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    limit: int = Query(500, ge=1, le=10000),
):
    """Get observations for any FRED series by ID (e.g., GDP, UNRATE, CPIAUCSL)."""
    result = await fred.get_series_data(series_id.upper(), start_date=start, end_date=end, limit=limit)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/popular")
async def popular_series():
    """Get a list of popular/commonly used FRED series."""
    return await fred.get_popular_series()


@router.get("/search")
async def search(
    q: str = Query(..., description="Search query (e.g., 'inflation', 'employment')"),
    limit: int = Query(20, ge=1, le=50),
):
    """Search FRED for economic data series."""
    results = await fred.search_series(q, limit=limit)
    if results and "error" in results[0]:
        raise HTTPException(status_code=400, detail=results[0]["error"])
    return {"query": q, "count": len(results), "results": results}


@router.get("/latest")
async def latest_values(
    ids: str = Query(..., description="Comma-separated series IDs (e.g., GDP,UNRATE,CPIAUCSL)"),
):
    """Get the most recent value for multiple FRED series."""
    series_ids = [s.strip().upper() for s in ids.split(",") if s.strip()]
    if not series_ids:
        raise HTTPException(status_code=400, detail="Provide at least one series ID")
    results = await fred.get_latest_values(series_ids)
    if results and "error" in results[0] and "not configured" in str(results[0].get("error", "")):
        raise HTTPException(status_code=400, detail=results[0]["error"])
    return results


# Convenience shortcuts for common series
@router.get("/gdp")
async def gdp(start: Optional[str] = None, end: Optional[str] = None):
    """Get US GDP data."""
    return await fred.get_series_data("GDP", start_date=start, end_date=end)


@router.get("/unemployment")
async def unemployment(start: Optional[str] = None, end: Optional[str] = None):
    """Get US unemployment rate."""
    return await fred.get_series_data("UNRATE", start_date=start, end_date=end)


@router.get("/cpi")
async def cpi(start: Optional[str] = None, end: Optional[str] = None):
    """Get Consumer Price Index data."""
    return await fred.get_series_data("CPIAUCSL", start_date=start, end_date=end)


@router.get("/fed-funds")
async def fed_funds(start: Optional[str] = None, end: Optional[str] = None):
    """Get Federal Funds Rate."""
    return await fred.get_series_data("FEDFUNDS", start_date=start, end_date=end)


@router.get("/treasury-yields")
async def treasury_yields():
    """Get latest Treasury yield curve data points."""
    series = ["DGS1MO", "DGS3MO", "DGS6MO", "DGS1", "DGS2", "DGS3", "DGS5", "DGS7", "DGS10", "DGS20", "DGS30"]
    return await fred.get_latest_values(series)


@router.get("/inflation")
async def inflation(start: Optional[str] = None, end: Optional[str] = None):
    """Get PCE inflation data (Fed's preferred measure)."""
    return await fred.get_series_data("PCEPI", start_date=start, end_date=end)


@router.get("/mortgage-rate")
async def mortgage_rate(start: Optional[str] = None, end: Optional[str] = None):
    """Get 30-year fixed mortgage rate."""
    return await fred.get_series_data("MORTGAGE30US", start_date=start, end_date=end)
