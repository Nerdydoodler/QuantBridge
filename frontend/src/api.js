import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quantbridge_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Stocks
export const getStockQuote = (symbol) => api.get(`/stocks/quote/${symbol}`)
export const getStockHistory = (symbol, params = {}) => api.get(`/stocks/history/${symbol}`, { params })
export const getStockFundamentals = (symbol) => api.get(`/stocks/fundamentals/${symbol}`)
export const getStockTechnicals = (symbol, params = {}) => api.get(`/stocks/technicals/${symbol}`, { params })
export const searchStocks = (q) => api.get('/stocks/search', { params: { q } })
export const getIncomeStatement = (symbol, quarterly = false) => api.get(`/stocks/financials/${symbol}/income`, { params: { quarterly } })
export const getBalanceSheet = (symbol, quarterly = false) => api.get(`/stocks/financials/${symbol}/balance`, { params: { quarterly } })

// Crypto
export const getCryptoPrices = (ids) => api.get('/crypto/prices', { params: { ids } })
export const getCryptoHistory = (coinId, days = 30) => api.get(`/crypto/history/${coinId}`, { params: { days } })
export const getTrendingCrypto = () => api.get('/crypto/trending')
export const searchCrypto = (q) => api.get('/crypto/search', { params: { q } })

// Forex
export const getForexQuote = (base, quote) => api.get(`/forex/quote/${base}/${quote}`)
export const getForexHistory = (base, quote, params = {}) => api.get(`/forex/history/${base}/${quote}`, { params })
export const getMajorPairs = () => api.get('/forex/majors')
export const convertCurrency = (amount, from, to) => api.get('/forex/convert', { params: { amount, from_cur: from, to_cur: to } })

// Economy
export const getMarketOverview = () => api.get('/economy/overview')
export const getEconomicCalendar = () => api.get('/economy/calendar')
export const getTreasuryRates = () => api.get('/economy/treasury')
export const getSectorPerformance = () => api.get('/economy/sectors')

// News
export const getMarketNews = (limit = 20) => api.get('/news/market', { params: { limit } })
export const getStockNews = (symbol, limit = 10) => api.get(`/news/stock/${symbol}`, { params: { limit } })
export const getCryptoNews = (limit = 15) => api.get('/news/crypto', { params: { limit } })

// Auth
export const login = (username, password) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form)
}
export const register = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')

// Portfolio
export const getWatchlists = () => api.get('/portfolio/watchlists')
export const createWatchlist = (name) => api.post('/portfolio/watchlists', { name })
export const getWatchlist = (id) => api.get(`/portfolio/watchlists/${id}`)
export const addToWatchlist = (id, symbol) => api.post(`/portfolio/watchlists/${id}/items`, { symbol })
export const getPortfolios = () => api.get('/portfolio/portfolios')
export const createPortfolio = (name) => api.post('/portfolio/portfolios', { name })
export const getPortfolio = (id) => api.get(`/portfolio/portfolios/${id}`)
export const addHolding = (id, data) => api.post(`/portfolio/portfolios/${id}/holdings`, data)

// Analytics / Visualize
export const getAnalyticsSeries = (symbols, period = '1y', interval = '1d', start, end) => {
  const params = { symbols, period, interval }
  if (start) params.start = start
  if (end) params.end = end
  return api.get('/analytics/series', { params })
}
export const getAnalyticsCompare = (symbols, period = '1y', interval = '1d', start, end) => {
  const params = { symbols, period, interval }
  if (start) params.start = start
  if (end) params.end = end
  return api.get('/analytics/compare', { params })
}
export const suggestSymbols = (q) => api.get('/analytics/symbols/suggest', { params: { q } })

export default api
