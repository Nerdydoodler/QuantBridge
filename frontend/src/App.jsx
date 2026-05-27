import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import CryptoPage from './pages/CryptoPage'
import ForexPage from './pages/ForexPage'
import NewsPage from './pages/NewsPage'
import ScreenerPage from './pages/ScreenerPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ListsPage from './pages/ListsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="stock/:symbol" element={<StockDetail />} />
        <Route path="crypto" element={<CryptoPage />} />
        <Route path="forex" element={<ForexPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="screener" element={<ScreenerPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  )
}
