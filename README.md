# FinSight - Private Financial Data Platform

A self-hosted financial data platform providing real-time market data, technical analysis, cryptocurrency tracking, forex rates, and news aggregation. Built entirely from scratch for private server deployment.

## Features

- **Stocks** — Real-time quotes, historical prices, fundamentals, income statements, balance sheets, technical indicators (RSI, MACD, Bollinger Bands, SMAs, ATR)
- **Cryptocurrency** — Live prices, market caps, historical charts, trending coins (via CoinGecko)
- **Forex** — Major currency pairs, historical rates, currency converter
- **Economy** — Market indices overview, sector performance, treasury rates, economic calendar
- **News** — Aggregated financial news from RSS feeds (Reuters, CNBC, MarketWatch, Yahoo Finance)
- **Portfolio** — Watchlists and portfolio tracking with P&L calculations
- **Authentication** — JWT-based user accounts
- **Search** — Symbol search across stocks and crypto

## Architecture

```
TestBB/
├── backend/          # Python FastAPI REST API
│   ├── app/
│   │   ├── main.py           # Application entry point
│   │   ├── config.py         # Configuration & env vars
│   │   ├── auth.py           # JWT authentication
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── database.py       # Async database setup
│   │   ├── routers/          # API route handlers
│   │   └── services/         # Business logic & data fetching
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React + Vite + TailwindCSS dashboard
│   ├── src/
│   │   ├── pages/            # Dashboard, Stock Detail, Crypto, Forex, News, Screener
│   │   ├── components/       # Layout, Charts, SearchBar, StatCard
│   │   └── api.js            # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start (Development)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/Mac

python run.py
```

API available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`

## Deploy to Private Server (Docker)

```bash
# Create .env file for backend
cd backend
cp .env.example .env
# Edit .env with your settings (especially FINSIGHT_SECRET_KEY)

# Build and run
cd ..
docker-compose up -d --build
```

- **Frontend**: http://your-server:3000
- **Backend API**: http://your-server:8000
- **API Docs**: http://your-server:8000/docs

### With Redis caching:

```bash
docker-compose --profile with-cache up -d --build
```

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Stocks | `GET /api/stocks/quote/{symbol}` | Current stock quote |
| Stocks | `GET /api/stocks/history/{symbol}` | Historical prices |
| Stocks | `GET /api/stocks/fundamentals/{symbol}` | Company fundamentals |
| Stocks | `GET /api/stocks/technicals/{symbol}` | Technical indicators |
| Stocks | `GET /api/stocks/search?q=` | Symbol search |
| Crypto | `GET /api/crypto/prices` | Crypto market prices |
| Crypto | `GET /api/crypto/history/{coin_id}` | Crypto price history |
| Crypto | `GET /api/crypto/trending` | Trending coins |
| Forex  | `GET /api/forex/quote/{base}/{quote}` | Exchange rate |
| Forex  | `GET /api/forex/majors` | Major pairs |
| Forex  | `GET /api/forex/convert` | Currency conversion |
| Economy | `GET /api/economy/overview` | Market indices |
| Economy | `GET /api/economy/sectors` | Sector performance |
| Economy | `GET /api/economy/treasury` | Treasury yields |
| News   | `GET /api/news/market` | Market news |
| News   | `GET /api/news/stock/{symbol}` | Stock-specific news |
| News   | `GET /api/news/crypto` | Crypto news |
| Auth   | `POST /api/auth/register` | Create account |
| Auth   | `POST /api/auth/login` | Get JWT token |

## Optional API Keys

For enhanced data, you can add free API keys to `.env`:

- **Alpha Vantage** — [alphavantage.co](https://www.alphavantage.co/support/#api-key) (free tier)
- **Finnhub** — [finnhub.io](https://finnhub.io/) (free tier)
- **NewsAPI** — [newsapi.org](https://newsapi.org/) (free developer tier)

## Data Sources

All data is fetched from publicly available sources:
- **Yahoo Finance** (via yfinance library) — Stocks, forex, indices
- **CoinGecko** (free API) — Cryptocurrency data
- **RSS Feeds** — Financial news from public feeds
- **Computed** — Technical indicators calculated from raw price data

## License

This is a private project. All code is original and written from scratch.

## Security Notes

- Change `FINSIGHT_SECRET_KEY` in production
- Use HTTPS via a reverse proxy (nginx/Caddy) in production
- Restrict `FINSIGHT_CORS_ORIGINS` to your domain
- Consider adding rate limiting for public-facing deployments
