import httpx
from typing import Optional


COINGECKO_BASE = "https://api.coingecko.com/api/v3"


async def get_crypto_prices(ids: str = "bitcoin,ethereum,solana", vs_currency: str = "usd") -> list[dict]:
    """Fetch current prices for cryptocurrencies using CoinGecko free API."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                "vs_currency": vs_currency,
                "ids": ids,
                "order": "market_cap_desc",
                "per_page": 50,
                "page": 1,
                "sparkline": "false",
                "price_change_percentage": "1h,24h,7d",
            },
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for coin in data:
        results.append({
            "id": coin.get("id"),
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name"),
            "price": coin.get("current_price"),
            "market_cap": coin.get("market_cap"),
            "volume_24h": coin.get("total_volume"),
            "change_1h": coin.get("price_change_percentage_1h_in_currency"),
            "change_24h": coin.get("price_change_percentage_24h_in_currency"),
            "change_7d": coin.get("price_change_percentage_7d_in_currency"),
            "circulating_supply": coin.get("circulating_supply"),
            "total_supply": coin.get("total_supply"),
            "ath": coin.get("ath"),
            "ath_change_percent": coin.get("ath_change_percentage"),
            "image": coin.get("image"),
        })

    return results


async def get_crypto_history(coin_id: str, days: int = 30, vs_currency: str = "usd") -> list[dict]:
    """Fetch historical price data for a cryptocurrency."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{COINGECKO_BASE}/coins/{coin_id}/market_chart",
            params={"vs_currency": vs_currency, "days": days},
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    prices = data.get("prices", [])
    volumes = data.get("total_volumes", [])
    market_caps = data.get("market_caps", [])

    results = []
    for i, (timestamp, price) in enumerate(prices):
        entry = {
            "timestamp": timestamp,
            "price": price,
            "volume": volumes[i][1] if i < len(volumes) else None,
            "market_cap": market_caps[i][1] if i < len(market_caps) else None,
        }
        results.append(entry)

    return results


async def get_trending_crypto() -> list[dict]:
    """Fetch trending cryptocurrencies."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{COINGECKO_BASE}/search/trending",
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    coins = data.get("coins", [])
    results = []
    for item in coins:
        coin = item.get("item", {})
        results.append({
            "id": coin.get("id"),
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name"),
            "market_cap_rank": coin.get("market_cap_rank"),
            "thumb": coin.get("thumb"),
            "score": coin.get("score"),
        })

    return results


async def search_crypto(query: str) -> list[dict]:
    """Search for cryptocurrencies by name or symbol."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{COINGECKO_BASE}/search",
            params={"query": query},
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for coin in data.get("coins", [])[:20]:
        results.append({
            "id": coin.get("id"),
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name"),
            "market_cap_rank": coin.get("market_cap_rank"),
            "thumb": coin.get("thumb"),
        })

    return results
