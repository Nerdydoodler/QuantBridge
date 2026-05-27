import asyncio
from concurrent.futures import ThreadPoolExecutor

import yfinance as yf
from yahooquery import Ticker as YQTicker
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.services.cache import cache

_executor = ThreadPoolExecutor(max_workers=12)


def _get_quote_yq(symbol: str) -> dict:
    """Use yahooquery for quote data (more reliable, no 429 errors)."""
    t = YQTicker(symbol)
    price_data = t.price.get(symbol, {})
    detail = t.summary_detail.get(symbol, {})
    profile = t.asset_profile.get(symbol, {})
    stats = t.key_stats.get(symbol, {})

    if isinstance(price_data, str):
        price_data = {}
    if isinstance(detail, str):
        detail = {}
    if isinstance(profile, str):
        profile = {}
    if isinstance(stats, str):
        stats = {}

    return {
        "symbol": symbol.upper(),
        "name": price_data.get("longName", price_data.get("shortName", symbol)),
        "price": price_data.get("regularMarketPrice"),
        "previous_close": detail.get("previousClose", price_data.get("regularMarketPreviousClose")),
        "open": price_data.get("regularMarketOpen"),
        "day_high": price_data.get("regularMarketDayHigh"),
        "day_low": price_data.get("regularMarketDayLow"),
        "volume": price_data.get("regularMarketVolume"),
        "market_cap": price_data.get("marketCap"),
        "pe_ratio": detail.get("trailingPE"),
        "eps": stats.get("trailingEps"),
        "dividend_yield": detail.get("dividendYield"),
        "fifty_two_week_high": detail.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": detail.get("fiftyTwoWeekLow"),
        "avg_volume": detail.get("averageVolume"),
        "beta": stats.get("beta"),
        "sector": profile.get("sector"),
        "industry": profile.get("industry"),
        "exchange": price_data.get("exchangeName"),
        "currency": price_data.get("currency", "USD"),
    }


def _get_quotes_batch_yq(symbols: list[str]) -> dict:
    """Fetch multiple quotes at once using yahooquery batch."""
    t = YQTicker(" ".join(symbols))
    price_data = t.price
    if isinstance(price_data, str):
        return {}
    return price_data


def _get_ticker_history(symbol: str, **kwargs) -> pd.DataFrame:
    """Synchronous yfinance history call (runs in thread pool)."""
    return yf.Ticker(symbol).history(**kwargs)


async def get_quote(symbol: str) -> dict:
    """Fetch current quote data for a stock symbol."""
    cache_key = f"quote:{symbol.upper()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(_executor, _get_quote_yq, symbol)
    cache.set(cache_key, result, ttl_seconds=60)
    return result


async def get_historical(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> list[dict]:
    """Fetch historical price data."""
    cache_key = f"history:{symbol.upper()}:{period}:{interval}:{start}:{end}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    if start and end:
        df = await loop.run_in_executor(_executor, lambda: _get_ticker_history(symbol, start=start, end=end, interval=interval))
    else:
        df = await loop.run_in_executor(_executor, lambda: _get_ticker_history(symbol, period=period, interval=interval))

    if df.empty:
        return []

    df = df.reset_index()
    records = []
    for _, row in df.iterrows():
        date_val = row.get("Date", row.get("Datetime"))
        records.append({
            "date": str(date_val),
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })

    cache.set(cache_key, records, ttl_seconds=300)
    return records


async def get_fundamentals(symbol: str) -> dict:
    """Fetch fundamental financial data."""
    cache_key = f"fundamentals:{symbol.upper()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(_executor, _get_ticker_info, symbol)

    result = {
        "symbol": symbol.upper(),
        "name": info.get("longName", ""),
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "country": info.get("country", ""),
        "employees": info.get("fullTimeEmployees"),
        "description": info.get("longBusinessSummary", ""),
        "website": info.get("website", ""),
        "financials": {
            "revenue": info.get("totalRevenue"),
            "gross_profit": info.get("grossProfits"),
            "ebitda": info.get("ebitda"),
            "net_income": info.get("netIncomeToCommon"),
            "total_debt": info.get("totalDebt"),
            "total_cash": info.get("totalCash"),
            "free_cashflow": info.get("freeCashflow"),
            "operating_cashflow": info.get("operatingCashflow"),
        },
        "ratios": {
            "pe_trailing": info.get("trailingPE"),
            "pe_forward": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "price_to_book": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),
            "debt_to_equity": info.get("debtToEquity"),
            "return_on_equity": info.get("returnOnEquity"),
            "return_on_assets": info.get("returnOnAssets"),
            "profit_margin": info.get("profitMargins"),
            "operating_margin": info.get("operatingMargins"),
        },
        "dividends": {
            "dividend_rate": info.get("dividendRate"),
            "dividend_yield": info.get("dividendYield"),
            "payout_ratio": info.get("payoutRatio"),
            "ex_dividend_date": str(info.get("exDividendDate", "")),
        },
    }
    cache.set(cache_key, result, ttl_seconds=600)
    return result


async def get_income_statement(symbol: str, quarterly: bool = False) -> list[dict]:
    """Fetch income statement data."""
    loop = asyncio.get_event_loop()

    def _fetch():
        ticker = yf.Ticker(symbol)
        return ticker.quarterly_income_stmt if quarterly else ticker.income_stmt

    df = await loop.run_in_executor(_executor, _fetch)

    if df is None or df.empty:
        return []

    results = []
    for col in df.columns:
        period_data = {"period": str(col.date()) if hasattr(col, "date") else str(col)}
        for idx in df.index:
            val = df.loc[idx, col]
            period_data[str(idx).replace(" ", "_").lower()] = None if pd.isna(val) else float(val)
        results.append(period_data)

    return results


async def get_balance_sheet(symbol: str, quarterly: bool = False) -> list[dict]:
    """Fetch balance sheet data."""
    loop = asyncio.get_event_loop()

    def _fetch():
        ticker = yf.Ticker(symbol)
        return ticker.quarterly_balance_sheet if quarterly else ticker.balance_sheet

    df = await loop.run_in_executor(_executor, _fetch)

    if df is None or df.empty:
        return []

    results = []
    for col in df.columns:
        period_data = {"period": str(col.date()) if hasattr(col, "date") else str(col)}
        for idx in df.index:
            val = df.loc[idx, col]
            period_data[str(idx).replace(" ", "_").lower()] = None if pd.isna(val) else float(val)
        results.append(period_data)

    return results


async def search_symbols(query: str) -> list[dict]:
    """Search for stock symbols matching a query."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://query2.finance.yahoo.com/v1/finance/search",
                params={"q": query, "quotesCount": 10, "newsCount": 0},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for quote in data.get("quotes", []):
                    results.append({
                        "symbol": quote.get("symbol", ""),
                        "name": quote.get("longname", quote.get("shortname", "")),
                        "type": quote.get("quoteType", ""),
                        "exchange": quote.get("exchange", ""),
                    })
                return results
    except Exception:
        pass

    return []


def compute_technical_indicators(prices: list[dict]) -> dict:
    """Compute common technical indicators from price data."""
    if not prices or len(prices) < 20:
        return {"error": "Insufficient data for technical analysis"}

    closes = np.array([p["close"] for p in prices])
    highs = np.array([p["high"] for p in prices])
    lows = np.array([p["low"] for p in prices])
    volumes = np.array([p["volume"] for p in prices], dtype=float)

    # Simple Moving Averages
    sma_20 = float(np.mean(closes[-20:]))
    sma_50 = float(np.mean(closes[-50:])) if len(closes) >= 50 else None
    sma_200 = float(np.mean(closes[-200:])) if len(closes) >= 200 else None

    # Exponential Moving Average (20-day)
    ema_20 = _ema(closes, 20)

    # RSI (14-day)
    rsi = _rsi(closes, 14)

    # MACD
    macd_line, signal_line, histogram = _macd(closes)

    # Bollinger Bands
    bb_upper, bb_middle, bb_lower = _bollinger_bands(closes, 20)

    # Average True Range
    atr = _atr(highs, lows, closes, 14)

    # Volume SMA
    vol_sma_20 = float(np.mean(volumes[-20:])) if len(volumes) >= 20 else None

    return {
        "sma_20": round(sma_20, 4),
        "sma_50": round(sma_50, 4) if sma_50 else None,
        "sma_200": round(sma_200, 4) if sma_200 else None,
        "ema_20": round(ema_20, 4),
        "rsi_14": round(rsi, 2),
        "macd": {
            "macd_line": round(macd_line, 4),
            "signal_line": round(signal_line, 4),
            "histogram": round(histogram, 4),
        },
        "bollinger_bands": {
            "upper": round(bb_upper, 4),
            "middle": round(bb_middle, 4),
            "lower": round(bb_lower, 4),
        },
        "atr_14": round(atr, 4),
        "volume_sma_20": round(vol_sma_20, 0) if vol_sma_20 else None,
        "current_price": round(float(closes[-1]), 4),
    }


def _ema(data: np.ndarray, period: int) -> float:
    multiplier = 2 / (period + 1)
    ema = float(data[0])
    for price in data[1:]:
        ema = (float(price) - ema) * multiplier + ema
    return ema


def _rsi(closes: np.ndarray, period: int = 14) -> float:
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _macd(closes: np.ndarray) -> tuple:
    ema_12 = _ema(closes, 12)
    ema_26 = _ema(closes, 26)
    macd_line = ema_12 - ema_26

    # Approximate signal line
    if len(closes) >= 35:
        macd_series = []
        for i in range(26, len(closes)):
            e12 = _ema(closes[: i + 1], 12)
            e26 = _ema(closes[: i + 1], 26)
            macd_series.append(e12 - e26)
        signal_line = _ema(np.array(macd_series), 9)
    else:
        signal_line = macd_line * 0.9

    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def _bollinger_bands(closes: np.ndarray, period: int = 20) -> tuple:
    sma = float(np.mean(closes[-period:]))
    std = float(np.std(closes[-period:]))
    return sma + 2 * std, sma, sma - 2 * std


def _atr(highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
    tr_values = []
    for i in range(1, len(highs)):
        tr = max(
            float(highs[i]) - float(lows[i]),
            abs(float(highs[i]) - float(closes[i - 1])),
            abs(float(lows[i]) - float(closes[i - 1])),
        )
        tr_values.append(tr)
    return float(np.mean(tr_values[-period:])) if len(tr_values) >= period else 0.0
