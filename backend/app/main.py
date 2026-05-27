from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    stocks_router,
    crypto_router,
    forex_router,
    economy_router,
    news_router,
    portfolio_router,
    fred_router,
    analytics_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(stocks_router.router)
app.include_router(crypto_router.router)
app.include_router(forex_router.router)
app.include_router(economy_router.router)
app.include_router(news_router.router)
app.include_router(portfolio_router.router)
app.include_router(fred_router.router)
app.include_router(analytics_router.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs": "/docs",
        "endpoints": {
            "stocks": "/api/stocks",
            "crypto": "/api/crypto",
            "forex": "/api/forex",
            "economy": "/api/economy",
            "fred": "/api/fred",
            "analytics": "/api/analytics",
            "news": "/api/news",
            "portfolio": "/api/portfolio",
            "auth": "/api/auth",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
