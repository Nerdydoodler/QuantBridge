import httpx
import feedparser
from typing import Optional
from datetime import datetime

from app.config import settings


# RSS feeds for financial news (publicly available)
FINANCIAL_RSS_FEEDS = {
    "reuters_business": "https://feeds.reuters.com/reuters/businessNews",
    "reuters_markets": "https://feeds.reuters.com/reuters/companyNews",
    "wsj_markets": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    "wsj_business": "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
    "bloomberg_markets": "https://feeds.bloomberg.com/markets/news.rss",
    "ft_markets": "https://www.ft.com/markets?format=rss",
    "cnbc": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "cnbc_world": "https://www.cnbc.com/id/100727362/device/rss/rss.html",
    "marketwatch": "https://feeds.marketwatch.com/marketwatch/topstories/",
    "barrons": "https://feeds.barrons.com/barrons/articles",
    "economist_finance": "https://www.economist.com/finance-and-economics/rss.xml",
    "yahoo_finance": "https://finance.yahoo.com/news/rssindex",
    "seeking_alpha": "https://seekingalpha.com/market_currents.xml",
    "business_insider": "https://markets.businessinsider.com/rss/news",
}


async def get_market_news(limit: int = 20) -> list[dict]:
    """Fetch latest market news from RSS feeds."""
    all_articles = []

    for source, url in FINANCIAL_RSS_FEEDS.items():
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; QuantBridge/1.0)"})
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.text)
                    feed_title = feed.feed.get("title", source.replace("_", " ").title())
                    for entry in feed.entries[:8]:
                        published = entry.get("published", entry.get("updated", ""))
                        all_articles.append({
                            "title": entry.get("title", ""),
                            "summary": entry.get("summary", "")[:300],
                            "link": entry.get("link", ""),
                            "source": feed_title,
                            "published": published,
                        })
        except Exception:
            continue

    # Sort by recency (best effort)
    all_articles.sort(key=lambda x: x.get("published", ""), reverse=True)
    return all_articles[:limit]


async def get_stock_news(symbol: str, limit: int = 10) -> list[dict]:
    """Fetch news for a specific stock symbol."""
    articles = []

    # Use Yahoo Finance RSS for symbol-specific news
    try:
        url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                feed = feedparser.parse(resp.text)
                for entry in feed.entries[:limit]:
                    articles.append({
                        "title": entry.get("title", ""),
                        "summary": entry.get("summary", "")[:300],
                        "link": entry.get("link", ""),
                        "source": "Yahoo Finance",
                        "published": entry.get("published", ""),
                        "symbol": symbol.upper(),
                    })
    except Exception:
        pass

    # If NewsAPI key is available, supplement with that
    if settings.NEWS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": symbol,
                        "language": "en",
                        "sortBy": "publishedAt",
                        "pageSize": limit,
                        "apiKey": settings.NEWS_API_KEY,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for article in data.get("articles", []):
                        articles.append({
                            "title": article.get("title", ""),
                            "summary": article.get("description", "")[:300],
                            "link": article.get("url", ""),
                            "source": article.get("source", {}).get("name", "NewsAPI"),
                            "published": article.get("publishedAt", ""),
                            "symbol": symbol.upper(),
                        })
        except Exception:
            pass

    return articles[:limit]


async def get_crypto_news(limit: int = 15) -> list[dict]:
    """Fetch cryptocurrency-related news."""
    articles = []

    crypto_feeds = [
        "https://cointelegraph.com/rss",
        "https://coindesk.com/arc/outboundfeeds/rss/",
        "https://decrypt.co/feed",
        "https://bitcoinmagazine.com/.rss/full/",
        "https://thedefiant.io/feed",
        "https://blockworks.co/feed",
    ]

    for url in crypto_feeds:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; QuantBridge/1.0)"})
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.text)
                    source_name = feed.feed.get("title", "Crypto News")
                    for entry in feed.entries[:8]:
                        articles.append({
                            "title": entry.get("title", ""),
                            "summary": entry.get("summary", "")[:300],
                            "link": entry.get("link", ""),
                            "source": source_name,
                            "published": entry.get("published", ""),
                        })
        except Exception:
            continue

    articles.sort(key=lambda x: x.get("published", ""), reverse=True)
    return articles[:limit]
