import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp } from 'lucide-react'
import { getStockQuote } from '../api'
import SortableTable from '../components/SortableTable'
import useCurrency from '../hooks/useCurrency'

const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
  'JPM', 'V', 'UNH', 'JNJ', 'XOM', 'PG', 'MA', 'HD',
  'CVX', 'MRK', 'ABBV', 'PEP', 'KO', 'COST', 'AVGO', 'LLY',
]

export default function ScreenerPage() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [symbols, setSymbols] = useState('')
  const navigate = useNavigate()
  const { format: fmtCurrency } = useCurrency()

  const fetchQuotes = async (symbolList) => {
    setLoading(true)
    const results = []
    const list = symbolList || symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)

    for (const sym of list.slice(0, 20)) {
      try {
        const { data } = await getStockQuote(sym)
        results.push(data)
      } catch {
        results.push({ symbol: sym, error: 'Failed to fetch' })
      }
    }

    setQuotes(results)
    setLoading(false)
  }

  const loadPopular = () => {
    setSymbols(POPULAR_SYMBOLS.slice(0, 12).join(', '))
    fetchQuotes(POPULAR_SYMBOLS.slice(0, 12))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Screener</h1>

      {/* Input */}
      <div className="card">
        <label className="text-xs text-gray-500 block mb-2">
          Enter symbols (comma-separated)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            placeholder="AAPL, MSFT, GOOGL..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && fetchQuotes()}
          />
          <button onClick={() => fetchQuotes()} className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Fetch'}
          </button>
          <button onClick={loadPopular} className="btn-secondary">
            Popular
          </button>
        </div>
      </div>

      {/* Results */}
      {quotes.length > 0 && (
        <div className="card overflow-x-auto">
          <SortableTable
            rowKey={(row) => row.symbol}
            onRowClick={(row) => !row.error && navigate(`/stock/${row.symbol}`)}
            columns={[
              { key: 'symbol', label: 'Symbol', sortValue: (r) => r.symbol, render: (r) => <span className={r.error ? 'font-medium' : 'font-medium text-primary-300'}>{r.symbol}</span> },
              { key: 'name', label: 'Name', sortValue: (r) => r.name?.toLowerCase() || '', render: (r) => r.error ? <span className="text-red-400 text-xs">{r.error}</span> : <span className="text-gray-300 text-xs truncate max-w-[150px] block">{r.name}</span> },
              { key: 'price', label: 'Price', align: 'right', sortValue: (r) => r.price || 0, render: (r) => r.error ? '' : <span className="font-medium">{r.price ? fmtCurrency(r.price) : 'N/A'}</span> },
              { key: 'change', label: 'Change', align: 'right', sortValue: (r) => { const c = r.price && r.previous_close ? ((r.price - r.previous_close) / r.previous_close) * 100 : 0; return c }, render: (r) => {
                if (r.error) return ''
                const change = r.price && r.previous_close ? r.price - r.previous_close : null
                const pct = change && r.previous_close ? (change / r.previous_close) * 100 : null
                const isPos = (change || 0) >= 0
                return <span className={`text-xs ${isPos ? 'text-green-400' : 'text-red-400'}`}>{pct ? `${isPos ? '+' : ''}${pct.toFixed(2)}%` : '-'}</span>
              }},
              { key: 'market_cap', label: 'Market Cap', align: 'right', sortValue: (r) => r.market_cap || 0, render: (r) => r.error ? '' : <span className="text-gray-400 text-xs">{r.market_cap ? fmtCurrency(r.market_cap / 1e9, { decimals: 1 }) + 'B' : '-'}</span> },
              { key: 'pe_ratio', label: 'P/E', align: 'right', sortValue: (r) => r.pe_ratio || 0, render: (r) => r.error ? '' : <span className="text-gray-400 text-xs">{r.pe_ratio?.toFixed(1) || '-'}</span> },
              { key: 'volume', label: 'Volume', align: 'right', sortValue: (r) => r.volume || 0, render: (r) => r.error ? '' : <span className="text-gray-400 text-xs">{r.volume?.toLocaleString() || '-'}</span> },
            ]}
            data={quotes}
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3">Quick Access</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => navigate(`/stock/${sym}`)}
              className="px-3 py-1.5 text-xs bg-surface-700/50 hover:bg-primary-600/20 hover:text-primary-300 rounded-md transition-colors"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
