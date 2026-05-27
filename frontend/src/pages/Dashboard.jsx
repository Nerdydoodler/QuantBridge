import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Globe, BarChart3, Pin, PinOff,
  Plus, X, Layers, List, MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts'
import {
  getMarketOverview, getSectorPerformance, getMarketNews,
  getStockQuote, getAnalyticsCompare,
} from '../api'
import StatCard from '../components/StatCard'
import {
  getPinnedStocks, unpinStock, getPinnedCharts, unpinChart,
  getLists, createList, deleteList, renameList, removeFromList,
} from '../store/pins'
import useCurrency from '../hooks/useCurrency'

export default function Dashboard() {
  const navigate = useNavigate()
  const { format: fmtCurrency } = useCurrency()
  const [overview, setOverview] = useState([])
  const [sectors, setSectors] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  // Pinned items
  const [pinnedStocks, setPinnedStocks] = useState(getPinnedStocks())
  const [pinnedQuotes, setPinnedQuotes] = useState({})
  const [pinnedCharts, setPinnedCharts] = useState(getPinnedCharts())
  const [chartData, setChartData] = useState({})

  // Custom lists
  const [lists, setLists] = useState(getLists())
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingList, setEditingList] = useState(null)
  const [listQuotes, setListQuotes] = useState({})

  // Fetch market data
  useEffect(() => {
    async function fetchData() {
      try {
        const [ovRes, secRes, newsRes] = await Promise.allSettled([
          getMarketOverview(),
          getSectorPerformance(),
          getMarketNews(8),
        ])
        if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data)
        if (secRes.status === 'fulfilled') setSectors(secRes.value.data)
        if (newsRes.status === 'fulfilled') setNews(newsRes.value.data)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch pinned stock quotes
  useEffect(() => {
    if (pinnedStocks.length === 0) return
    pinnedStocks.forEach(async (pin) => {
      try {
        const res = await getStockQuote(pin.symbol)
        setPinnedQuotes(prev => ({ ...prev, [pin.symbol]: res.data }))
      } catch {}
    })
  }, [pinnedStocks])

  // Fetch pinned chart data
  useEffect(() => {
    pinnedCharts.forEach(async (chart) => {
      try {
        const symbols = chart.symbols.map(s => s.symbol).join(',')
        const res = await getAnalyticsCompare(symbols, chart.period || '3mo')
        setChartData(prev => ({ ...prev, [chart.id]: res.data }))
      } catch {}
    })
  }, [pinnedCharts])

  // Fetch list item quotes
  useEffect(() => {
    const allSymbols = lists.flatMap(l => l.items.map(i => i.symbol))
    const unique = [...new Set(allSymbols)]
    unique.forEach(async (sym) => {
      if (listQuotes[sym]) return
      try {
        const res = await getStockQuote(sym)
        setListQuotes(prev => ({ ...prev, [sym]: res.data }))
      } catch {}
    })
  }, [lists])

  const handleUnpinStock = (symbol) => {
    const updated = unpinStock(symbol)
    setPinnedStocks(updated)
  }

  const handleUnpinChart = (id) => {
    const updated = unpinChart(id)
    setPinnedCharts(updated)
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    const updated = createList(newListName.trim())
    setLists(updated)
    setNewListName('')
    setShowNewList(false)
  }

  const handleDeleteList = (id) => {
    const updated = deleteList(id)
    setLists(updated)
  }

  const handleRenameList = (id, name) => {
    const updated = renameList(id, name)
    setLists(updated)
    setEditingList(null)
  }

  const handleRemoveFromList = (listId, symbol) => {
    const updated = removeFromList(listId, symbol)
    setLists(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading market data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <span className="text-xs text-gray-500">Data may be delayed 15+ min</span>
      </div>

      {/* Market indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {overview.slice(0, 10).map((item, idx) => (
          <StatCard
            key={idx}
            title={item.name}
            value={item.price ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
            change={item.change_percent}
            prefix=""
            suffix=""
          />
        ))}
      </div>

      {/* Pinned Stocks */}
      {pinnedStocks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-gray-200">Pinned Stocks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedStocks.map((pin) => {
              const q = pinnedQuotes[pin.symbol]
              const change = q ? ((q.price - q.previous_close) / q.previous_close * 100) : null
              return (
                <div key={pin.symbol} className="card relative group cursor-pointer" onClick={() => navigate(`/stock/${pin.symbol}`)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnpinStock(pin.symbol) }}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-600 transition-all"
                    title="Unpin"
                  >
                    <PinOff className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-white">{pin.symbol}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">{pin.name || q?.name || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {q ? fmtCurrency(q.price) : '...'}
                      </p>
                      {change !== null && (
                        <p className={`text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pinned Analytics Charts */}
      {pinnedCharts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-gray-200">Pinned Charts</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pinnedCharts.map((chart) => {
              const data = chartData[chart.id]
              const merged = []
              if (data && data.series) {
                const dateMap = {}
                data.series.forEach(s => {
                  (s.data || []).forEach(pt => {
                    const d = pt.date.split(' ')[0].split('T')[0]
                    if (!dateMap[d]) dateMap[d] = { date: d }
                    dateMap[d][s.symbol] = pt.value
                  })
                })
                merged.push(...Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)))
              }

              const colors = ['#818cf8', '#34d399', '#f97316', '#f43f5e', '#a78bfa', '#22d3ee']

              return (
                <div key={chart.id} className="card relative group">
                  <button
                    onClick={() => handleUnpinChart(chart.id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-600 transition-all"
                    title="Unpin chart"
                  >
                    <PinOff className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xs font-semibold text-gray-300">{chart.name}</h3>
                    <span className="text-[10px] text-gray-500">({chart.period})</span>
                  </div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {chart.symbols.map((s, i) => (
                      <span key={s.symbol} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: colors[i % colors.length], backgroundColor: colors[i % colors.length] + '20' }}>
                        {s.symbol}
                      </span>
                    ))}
                  </div>
                  {merged.length > 0 ? (
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={merged}>
                        {chart.symbols.map((s, i) => (
                          <Line key={s.symbol} type="monotone" dataKey={s.symbol} stroke={colors[i % colors.length]} strokeWidth={1.5} dot={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-xs text-gray-500">Loading...</div>
                  )}
                  <button
                    onClick={() => navigate('/analytics')}
                    className="mt-2 text-[11px] text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Open in Analytics →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom Lists */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-gray-200">My Lists</h2>
          </div>
          <button
            onClick={() => setShowNewList(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New List
          </button>
        </div>

        {/* New list input */}
        {showNewList && (
          <div className="card mb-3 flex items-center gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              placeholder="List name (e.g., Growth Picks, Watchlist)..."
              className="input-field flex-1 text-sm"
              autoFocus
            />
            <button onClick={handleCreateList} className="btn-primary text-xs px-3 py-1.5">Create</button>
            <button onClick={() => { setShowNewList(false); setNewListName('') }} className="p-1.5 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {lists.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {lists.map((list) => (
              <div key={list.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  {editingList === list.id ? (
                    <input
                      type="text"
                      defaultValue={list.name}
                      onBlur={(e) => handleRenameList(list.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameList(list.id, e.target.value)}
                      className="input-field text-sm flex-1 mr-2"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm font-semibold text-white">{list.name}</h3>
                  )}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingList(editingList === list.id ? null : list.id)} className="p-1 rounded hover:bg-surface-600 text-gray-500 hover:text-white transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteList(list.id)} className="p-1 rounded hover:bg-surface-600 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {list.items.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">No items yet. Pin stocks from the stock detail page.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {list.items.map((item) => {
                      const q = listQuotes[item.symbol]
                      const change = q ? ((q.price - q.previous_close) / q.previous_close * 100) : null
                      return (
                        <div key={item.symbol} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-700/50 group">
                          <Link to={`/stock/${item.symbol}`} className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-xs font-bold text-white">{item.symbol}</span>
                            <span className="text-[11px] text-gray-500 truncate">{item.name}</span>
                          </Link>
                          <div className="flex items-center gap-2">
                            {q && (
                              <span className="text-xs font-medium text-white">{fmtCurrency(q.price)}</span>
                            )}
                            {change !== null && (
                              <span className={`text-[11px] font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.preventDefault(); handleRemoveFromList(list.id, item.symbol) }}
                              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-600 text-gray-500 hover:text-red-400 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-surface-700/50">
                  <span className="text-[10px] text-gray-500">{list.items.length} item{list.items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : !showNewList && (
          <div className="card text-center py-8">
            <List className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No custom lists yet</p>
            <p className="text-xs text-gray-500 mt-1">Create a list to organize stocks and track custom groups</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Performance */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold">Sector Performance</h2>
          </div>
          <div className="space-y-2">
            {sectors.slice(0, 11).map((sector, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-300">{sector.sector}</span>
                <span
                  className={`text-xs font-medium ${
                    (sector.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {sector.change_percent !== null
                    ? `${sector.change_percent >= 0 ? '+' : ''}${sector.change_percent}%`
                    : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* News */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold">Latest News</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {news.map((article, idx) => (
              <a
                key={idx}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg hover:bg-surface-700/50 transition-colors"
              >
                <h3 className="text-sm font-medium text-gray-200 line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-primary-400">{article.source}</span>
                  {article.published && (
                    <span className="text-xs text-gray-500">{article.published.slice(0, 16)}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
