from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_user
from app.database import get_db
from app.models import User, Watchlist, WatchlistItem, Portfolio, Holding
from app.services import stocks

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


class WatchlistCreate(BaseModel):
    name: str


class WatchlistItemAdd(BaseModel):
    symbol: str
    asset_type: str = "stock"


class PortfolioCreate(BaseModel):
    name: str


class HoldingAdd(BaseModel):
    symbol: str
    quantity: float
    avg_cost: float
    asset_type: str = "stock"


# --- Watchlists ---

@router.get("/watchlists")
async def get_watchlists(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Watchlist).where(Watchlist.user_id == user.id))
    watchlists = result.scalars().all()
    return [{"id": w.id, "name": w.name, "created_at": str(w.created_at)} for w in watchlists]


@router.post("/watchlists")
async def create_watchlist(
    data: WatchlistCreate, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)
):
    wl = Watchlist(name=data.name, user_id=user.id)
    db.add(wl)
    await db.commit()
    await db.refresh(wl)
    return {"id": wl.id, "name": wl.name}


@router.post("/watchlists/{watchlist_id}/items")
async def add_watchlist_item(
    watchlist_id: int,
    data: WatchlistItemAdd,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    item = WatchlistItem(symbol=data.symbol.upper(), asset_type=data.asset_type, watchlist_id=wl.id)
    db.add(item)
    await db.commit()
    return {"status": "added", "symbol": data.symbol.upper()}


@router.get("/watchlists/{watchlist_id}")
async def get_watchlist_with_prices(
    watchlist_id: int, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    items_result = await db.execute(select(WatchlistItem).where(WatchlistItem.watchlist_id == wl.id))
    items = items_result.scalars().all()

    enriched = []
    for item in items:
        try:
            quote = await stocks.get_quote(item.symbol)
            enriched.append({
                "symbol": item.symbol,
                "asset_type": item.asset_type,
                "price": quote.get("price"),
                "change_percent": (
                    round(((quote["price"] - quote["previous_close"]) / quote["previous_close"]) * 100, 2)
                    if quote.get("price") and quote.get("previous_close")
                    else None
                ),
                "name": quote.get("name"),
            })
        except Exception:
            enriched.append({"symbol": item.symbol, "asset_type": item.asset_type, "error": "Failed to fetch"})

    return {"id": wl.id, "name": wl.name, "items": enriched}


@router.delete("/watchlists/{watchlist_id}/items/{symbol}")
async def remove_watchlist_item(
    watchlist_id: int, symbol: str, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol.upper(),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return {"status": "removed", "symbol": symbol.upper()}


# --- Portfolios ---

@router.get("/portfolios")
async def get_portfolios(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user.id))
    portfolios = result.scalars().all()
    return [{"id": p.id, "name": p.name, "created_at": str(p.created_at)} for p in portfolios]


@router.post("/portfolios")
async def create_portfolio(
    data: PortfolioCreate, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)
):
    portfolio = Portfolio(name=data.name, user_id=user.id)
    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio)
    return {"id": portfolio.id, "name": portfolio.name}


@router.post("/portfolios/{portfolio_id}/holdings")
async def add_holding(
    portfolio_id: int,
    data: HoldingAdd,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holding = Holding(
        symbol=data.symbol.upper(),
        quantity=data.quantity,
        avg_cost=data.avg_cost,
        asset_type=data.asset_type,
        portfolio_id=portfolio.id,
    )
    db.add(holding)
    await db.commit()
    return {"status": "added", "symbol": data.symbol.upper(), "quantity": data.quantity}


@router.get("/portfolios/{portfolio_id}")
async def get_portfolio_performance(
    portfolio_id: int, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holdings_result = await db.execute(select(Holding).where(Holding.portfolio_id == portfolio.id))
    holdings = holdings_result.scalars().all()

    total_value = 0.0
    total_cost = 0.0
    enriched_holdings = []

    for h in holdings:
        try:
            quote = await stocks.get_quote(h.symbol)
            current_price = quote.get("price", 0) or 0
            market_value = current_price * h.quantity
            cost_basis = h.avg_cost * h.quantity
            gain_loss = market_value - cost_basis
            gain_loss_pct = round((gain_loss / cost_basis) * 100, 2) if cost_basis else 0

            total_value += market_value
            total_cost += cost_basis

            enriched_holdings.append({
                "symbol": h.symbol,
                "quantity": h.quantity,
                "avg_cost": h.avg_cost,
                "current_price": current_price,
                "market_value": round(market_value, 2),
                "gain_loss": round(gain_loss, 2),
                "gain_loss_percent": gain_loss_pct,
                "name": quote.get("name"),
            })
        except Exception:
            enriched_holdings.append({
                "symbol": h.symbol,
                "quantity": h.quantity,
                "avg_cost": h.avg_cost,
                "error": "Failed to fetch price",
            })

    total_gain = total_value - total_cost
    total_gain_pct = round((total_gain / total_cost) * 100, 2) if total_cost else 0

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain_loss": round(total_gain, 2),
        "total_gain_loss_percent": total_gain_pct,
        "holdings": enriched_holdings,
    }
