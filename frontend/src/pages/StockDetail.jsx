import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TrendingUp, TrendingDown, Info, BarChart2, Activity, Pin, PinOff, ListPlus, Check } from 'lucide-react'
import { getStockQuote, getStockHistory, getStockTechnicals, getStockFundamentals } from '../api'
import PriceChart from '../components/PriceChart'
import { isStockPinned, pinStock, unpinStock, getLists, addToList } from '../store/pins'
import useCurrency from '../hooks/useCurrency'

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y']

export default function StockDetail() {
  const { symbol } = useParams()
  const [quote, setQuote] = useState(null)
  const [history, setHistory] = useState([])
  const [technicals, setTechnicals] = useState(null)
  const [fundamentals, setFundamentals] = useState(null)
  const [period, setPeriod] = useState('1y')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chart')
  const [pinned, setPinned] = useState(isStockPinned(symbol))
  const [showListPicker, setShowListPicker] = useState(false)
  const [lists, setLists] = useState(getLists())
  const [addedToList, setAddedToList] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [qRes, hRes] = await Promise.allSettled([
          getStockQuote(symbol),
          getStockHistory(symbol, { period }),
        ])
        if (qRes.status === 'fulfilled') setQuote(qRes.value.data)
        if (hRes.status === 'fulfilled') setHistory(hRes.value.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [symbol, period])

  useEffect(() => {
    async function fetchExtras() {
      try {
        const [tRes, fRes] = await Promise.allSettled([
          getStockTechnicals(symbol),
          getStockFundamentals(symbol),
        ])
        if (tRes.status === 'fulfilled') setTechnicals(tRes.value.data.indicators)
        if (fRes.status === 'fulfilled') setFundamentals(fRes.value.data)
      } catch {}
    }
    fetchExtras()
  }, [symbol])

  const { format: fmtCurrency, convert, symbol: currSym } = useCurrency()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading {symbol}...</div>
      </div>
    )
  }
  const price = quote?.price
  const prevClose = quote?.previous_close
  const change = price && prevClose ? price - prevClose : null
  const changePct = change && prevClose ? (change / prevClose) * 100 : null
  const isPositive = change >= 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{symbol.toUpperCase()}</h1>
            {quote?.sector && (
              <span className="text-xs px-2 py-0.5 rounded bg-surface-700 text-gray-400">{quote.sector}</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{quote?.name}</p>
        </div>
        <div className="sm:ml-auto text-right">
          <p className="text-3xl font-bold">{price ? fmtCurrency(price) : 'N/A'}</p>
          {change !== null && (
            <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{isPositive ? '+' : ''}{fmtCurrency(Math.abs(change), { showSymbol: false })} ({changePct.toFixed(2)}%)</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${period === p ? 'bg-primary-600 text-white' : 'bg-surface-700/50 text-gray-400 hover:text-white'}`}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Pin & List actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => { if (pinned) { unpinStock(symbol); setPinned(false) } else { pinStock(symbol, quote?.name); setPinned(true) } }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${pinned ? 'bg-primary-600/20 border-primary-500/50 text-primary-300' : 'border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50'}`}>
          {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          {pinned ? 'Unpin' : 'Pin to Dashboard'}
        </button>

        <div className="relative">
          <button onClick={() => { setLists(getLists()); setShowListPicker(!showListPicker) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 transition-all">
            <ListPlus className="w-3.5 h-3.5" />
            Add to List
          </button>
          {showListPicker && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 py-1">
              {lists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500">No lists yet. Create one on the Dashboard.</p>
              ) : (
                lists.map(list => (
                  <button key={list.id} onClick={() => { addToList(list.id, { symbol: symbol.toUpperCase(), name: quote?.name || '', type: 'stock' }); setAddedToList(list.id); setTimeout(() => { setAddedToList(null); setShowListPicker(false) }, 800) }} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-surface-600 transition-colors">
                    <span className="text-gray-300">{list.name}</span>
                    {addedToList === list.id && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <PriceChart data={history} height={350} />
      </div>

      <div className="flex gap-1 border-b border-surface-700/50 pb-px">
        {[
          { id: 'chart', label: 'Key Stats', icon: Info },
          { id: 'technicals', label: 'Technicals', icon: Activity },
          { id: 'fundamentals', label: 'Fundamentals', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === id ? 'bg-surface-800 text-primary-300 border border-b-0 border-surface-700/50' : 'text-gray-400 hover:text-gray-200'}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'chart' && quote && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: quote.open },
            { label: 'Day High', value: quote.day_high },
            { label: 'Day Low', value: quote.day_low },
            { label: 'Volume', value: quote.volume?.toLocaleString(), prefix: '' },
            { label: 'Market Cap', value: quote.market_cap ? `${(quote.market_cap / 1e9).toFixed(2)}B` : 'N/A', prefix: '$' },
            { label: 'P/E Ratio', value: quote.pe_ratio?.toFixed(2), prefix: '' },
            { label: 'EPS', value: quote.eps?.toFixed(2) },
            { label: '52W High', value: quote.fifty_two_week_high },
            { label: '52W Low', value: quote.fifty_two_week_low },
            { label: 'Avg Volume', value: quote.avg_volume?.toLocaleString(), prefix: '' },
            { label: 'Beta', value: quote.beta?.toFixed(2), prefix: '' },
            { label: 'Dividend Yield', value: quote.dividend_yield ? `${(quote.dividend_yield * 100).toFixed(2)}%` : 'N/A', prefix: '' },
          ].map((stat, idx) => (
            <div key={idx} className="card">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-sm font-semibold mt-1">{stat.prefix !== undefined ? stat.prefix : '$'}{stat.value || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'technicals' && technicals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'RSI (14)', value: technicals.rsi_14 },
            { label: 'SMA 20', value: technicals.sma_20 },
            { label: 'SMA 50', value: technicals.sma_50 },
            { label: 'SMA 200', value: technicals.sma_200 },
            { label: 'EMA 20', value: technicals.ema_20 },
            { label: 'ATR (14)', value: technicals.atr_14 },
            { label: 'MACD Line', value: technicals.macd?.macd_line },
            { label: 'Signal Line', value: technicals.macd?.signal_line },
            { label: 'BB Upper', value: technicals.bollinger_bands?.upper },
            { label: 'BB Middle', value: technicals.bollinger_bands?.middle },
            { label: 'BB Lower', value: technicals.bollinger_bands?.lower },
            { label: 'Vol SMA 20', value: technicals.volume_sma_20?.toLocaleString() },
          ].map((stat, idx) => (
            <div key={idx} className="card">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-sm font-semibold mt-1">{stat.value ?? 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'fundamentals' && fundamentals && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-2">Company Info</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{fundamentals.description?.slice(0, 500)}</p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div><span className="text-gray-500">Sector:</span> {fundamentals.sector}</div>
              <div><span className="text-gray-500">Industry:</span> {fundamentals.industry}</div>
              <div><span className="text-gray-500">Country:</span> {fundamentals.country}</div>
              <div><span className="text-gray-500">Employees:</span> {fundamentals.employees?.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(fundamentals.ratios || {}).map(([key, val]) => (
              <div key={key} className="card">
                <p className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold mt-1">{val !== null && val !== undefined ? (typeof val === 'number' ? val.toFixed(4) : val) : 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}