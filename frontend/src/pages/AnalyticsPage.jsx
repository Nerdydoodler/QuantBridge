import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  Brush, ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import {
  Plus, X, Search, TrendingUp, BarChart3, Activity,
  Layers, Percent, DollarSign, Download, RotateCcw, Pin, List, Calendar,
} from 'lucide-react'
import { getAnalyticsSeries, getAnalyticsCompare, suggestSymbols } from '../api'
import { pinChart, getLists } from '../store/pins'
import useCurrency from '../hooks/useCurrency'

const COLORS = [
  '#818cf8', '#34d399', '#f97316', '#f43f5e', '#a78bfa',
  '#22d3ee', '#facc15', '#fb923c', '#4ade80', '#e879f9',
]

const PERIODS = [
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
  { value: '5y', label: '5Y' },
  { value: 'max', label: 'MAX' },
  { value: 'custom', label: 'Custom' },
]

const INTERVALS = [
  { value: '1d', label: 'Daily' },
  { value: '1wk', label: 'Weekly' },
  { value: '1mo', label: 'Monthly' },
  { value: '3mo', label: 'Quarterly' },
]

const CHART_TYPES = [
  { value: 'area', label: 'Area', icon: Activity },
  { value: 'line', label: 'Line', icon: TrendingUp },
  { value: 'bar', label: 'Bar', icon: BarChart3 },
]

const TYPE_BADGES = {
  stock: { bg: 'bg-blue-900/40', text: 'text-blue-400' },
  index: { bg: 'bg-purple-900/40', text: 'text-purple-400' },
  etf: { bg: 'bg-indigo-900/40', text: 'text-indigo-400' },
  forex: { bg: 'bg-green-900/40', text: 'text-green-400' },
  crypto: { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  commodity: { bg: 'bg-orange-900/40', text: 'text-orange-400' },
  bond: { bg: 'bg-teal-900/40', text: 'text-teal-400' },
}

export default function AnalyticsPage() {
  const [selectedSymbols, setSelectedSymbols] = useState([
    { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
  ])
  const [period, setPeriod] = useState('1y')
  const [interval, setInterval_] = useState('1d')
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [chartType, setChartType] = useState('area')
  const [normalize, setNormalize] = useState(false)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [seriesMeta, setSeriesMeta] = useState({})
  const [showListPicker, setShowListPicker] = useState(false)
  const [userLists, setUserLists] = useState([])
  const { format: fmtCurrency, symbol: currSym } = useCurrency()
  const searchRef = useRef(null)
  const listPickerRef = useRef(null)
  const debounceRef = useRef(null)
  const chartContainerRef = useRef(null)
  const exportRef = useRef(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Fetch chart data when symbols or settings change
  const fetchData = useCallback(async () => {
    if (selectedSymbols.length === 0) {
      setChartData([])
      return
    }

    // Skip fetch for custom range if dates aren't set
    if (period === 'custom' && (!customStart || !customEnd)) {
      return
    }

    setLoading(true)
    try {
      const symbolStr = selectedSymbols.map(s => s.symbol).join(',')
      const shouldNormalize = normalize || selectedSymbols.length > 1

      const effectivePeriod = period === 'custom' ? 'max' : period

      let res
      if (shouldNormalize) {
        res = await getAnalyticsCompare(symbolStr, effectivePeriod, interval, customStart && period === 'custom' ? customStart : undefined, customEnd && period === 'custom' ? customEnd : undefined)
      } else {
        res = await getAnalyticsSeries(symbolStr, effectivePeriod, interval, customStart && period === 'custom' ? customStart : undefined, customEnd && period === 'custom' ? customEnd : undefined)
      }

      const data = res.data
      if (!data.series || data.series.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      // Build merged dataset keyed by date
      const dateMap = {}
      const meta = {}

      data.series.forEach((s) => {
        if (!s.data || s.data.length === 0) return
        const values = s.data.map(d => shouldNormalize ? d.value : d.close).filter(v => v != null)
        meta[s.symbol] = {
          latest: values[values.length - 1],
          first: values[0],
          min: Math.min(...values),
          max: Math.max(...values),
          change: values.length > 1 ? values[values.length - 1] - values[0] : 0,
        }

        s.data.forEach((pt) => {
          const dateKey = pt.date.split(' ')[0].split('T')[0]
          if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey }
          dateMap[dateKey][s.symbol] = shouldNormalize ? pt.value : pt.close
        })
      })

      setSeriesMeta(meta)
      const merged = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))
      setChartData(merged)
    } catch (err) {
      console.error('Analytics fetch error:', err)
    }
    setLoading(false)
  }, [selectedSymbols, period, interval, normalize, customStart, customEnd])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Search suggestions
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await suggestSymbols(searchQuery)
        setSuggestions(res.data || [])
      } catch {
        setSuggestions([])
      }
      setSearchLoading(false)
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

  // Close search on click outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close list picker on click outside
  useEffect(() => {
    const handler = (e) => {
      if (listPickerRef.current && !listPickerRef.current.contains(e.target)) {
        setShowListPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadFromList = (list) => {
    const symbols = list.items.map(item => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      type: item.type || 'stock',
    })).slice(0, 10)
    setSelectedSymbols(symbols)
    setNormalize(true)
    setShowListPicker(false)
  }

  const openListPicker = () => {
    setUserLists(getLists())
    setShowListPicker(!showListPicker)
  }

  // Close export menu on click outside
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const exportAsPng = () => {
    setShowExportMenu(false)
    if (!chartContainerRef.current) return
    const svg = chartContainerRef.current.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const rect = svg.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, rect.width, rect.height)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
      const link = document.createElement('a')
      link.download = `quantbridge-chart-${selectedSymbols.map(s => s.symbol).join('-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const exportAsCsv = () => {
    setShowExportMenu(false)
    if (chartData.length === 0) return
    const symbols = selectedSymbols.map(s => s.symbol)
    const header = ['Date', ...symbols].join(',')
    const rows = chartData.map(row =>
      [row.date, ...symbols.map(s => row[s] ?? '')].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.download = `quantbridge-data-${symbols.join('-')}.csv`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportAsJson = () => {
    setShowExportMenu(false)
    if (chartData.length === 0) return
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `quantbridge-data-${selectedSymbols.map(s => s.symbol).join('-')}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const addSymbol = (item) => {
    if (selectedSymbols.length >= 10) return
    if (selectedSymbols.find(s => s.symbol === item.symbol)) return
    setSelectedSymbols(prev => [...prev, item])
    setSearchQuery('')
    setShowSearch(false)
  }

  const removeSymbol = (symbol) => {
    setSelectedSymbols(prev => prev.filter(s => s.symbol !== symbol))
  }

  const shouldNormalize = normalize || selectedSymbols.length > 1

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const formatValue = (val) => {
    if (val == null) return '—'
    if (shouldNormalize) return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
    return fmtCurrency(val)
  }

  const formatTickDate = (dateStr) => {
    try {
      if (interval === '3mo') return format(parseISO(dateStr), 'QQQ yyyy')
      if (interval === '1mo') return format(parseISO(dateStr), 'MMM yyyy')
      if (interval === '1wk') return format(parseISO(dateStr), 'MMM d')
      const p = period
      if (p === '1mo' || p === '3mo') return format(parseISO(dateStr), 'MMM d')
      if (p === '6mo' || p === '1y' || p === 'custom') return format(parseISO(dateStr), 'MMM yyyy')
      return format(parseISO(dateStr), 'MMM yy')
    } catch {
      return dateStr
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return (
      <div className="bg-surface-800 border border-surface-600 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2 font-medium">{formatDate(label)}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-300">{p.dataKey}</span>
            </span>
            <span className="font-mono font-medium" style={{ color: p.color }}>
              {formatValue(p.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : AreaChart

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary-400" />
            Analytics Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Cross-reference and visualize any combination of stocks, indices, currencies, and commodities
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Search */}
          <div ref={searchRef} className="relative flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
                onFocus={() => setShowSearch(true)}
                placeholder="Add symbol (e.g., AAPL, BTC-USD, ^GSPC, EURUSD=X)..."
                className="input-field w-full pl-10 pr-4 text-sm"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSearch && (searchQuery.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((s, i) => {
                    const alreadyAdded = selectedSymbols.find(sel => sel.symbol === s.symbol)
                    const badge = TYPE_BADGES[s.type] || TYPE_BADGES.stock
                    return (
                      <button
                        key={i}
                        onClick={() => !alreadyAdded && addSymbol(s)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-600 transition-colors ${
                          alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="font-mono text-sm font-semibold text-white min-w-[80px]">{s.symbol}</span>
                        <span className="text-sm text-gray-400 flex-1 truncate">{s.name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} uppercase`}>
                          {s.type}
                        </span>
                        {alreadyAdded && <span className="text-[10px] text-gray-500">Added</span>}
                      </button>
                    )
                  })
                ) : (
                  searchQuery.length >= 1 && !searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No results. Try typing a ticker like AAPL or MSFT
                    </div>
                  )
                )}

                {/* Quick add by typing exact symbol */}
                {searchQuery.length >= 1 && !suggestions.find(s => s.symbol.toUpperCase() === searchQuery.toUpperCase()) && (
                  <button
                    onClick={() => addSymbol({ symbol: searchQuery.toUpperCase(), name: searchQuery.toUpperCase(), type: 'stock' })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-600 border-t border-surface-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary-400" />
                    <span className="text-sm text-gray-300">Add <span className="font-mono font-bold text-white">{searchQuery.toUpperCase()}</span> directly</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Period selector */}
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value)
                  if (p.value === 'custom') {
                    setShowCustomRange(true)
                  } else {
                    setShowCustomRange(false)
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                  period === p.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.value === 'custom' && <Calendar className="w-3 h-3" />}
                {p.label}
              </button>
            ))}
          </div>

          {/* Interval selector */}
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => setInterval_(iv.value)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  interval === iv.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            {CHART_TYPES.map((ct) => {
              const Icon = ct.icon
              return (
                <button
                  key={ct.value}
                  onClick={() => setChartType(ct.value)}
                  title={ct.label}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    chartType === ct.value
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Normalize toggle */}
          <button
            onClick={() => setNormalize(!normalize)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              shouldNormalize
                ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                : 'border-surface-600 text-gray-400 hover:text-white hover:border-surface-500'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Normalize
          </button>

          {/* Load from List */}
          <div ref={listPickerRef} className="relative">
            <button
              onClick={openListPicker}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                showListPicker
                  ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                  : 'border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Load List
            </button>
            {showListPicker && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-surface-600">
                  <span className="text-xs font-semibold text-gray-300">Load from My Lists</span>
                </div>
                {userLists.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {userLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => loadFromList(list)}
                        disabled={list.items.length === 0}
                        className={`w-full text-left px-3 py-2.5 hover:bg-surface-600 transition-colors flex items-center justify-between ${
                          list.items.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="text-sm text-white truncate">{list.name}</span>
                        <span className="text-[10px] text-gray-500 ml-2 shrink-0">{list.items.length} items</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-500">No lists yet.</p>
                    <p className="text-[10px] text-gray-600 mt-1">Create lists from the Lists page.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pin Chart */}
          <button
            onClick={() => {
              pinChart({
                symbols: selectedSymbols,
                period,
                chartType,
                normalize,
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 transition-all"
          >
            <Pin className="w-3.5 h-3.5" />
            Pin Chart
          </button>

          {/* Export */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={chartData.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                showExportMenu
                  ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                  : chartData.length === 0
                    ? 'border-surface-600 text-gray-600 cursor-not-allowed'
                    : 'border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={exportAsPng}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-surface-600 transition-colors text-gray-300 hover:text-white"
                >
                  <span className="w-5 text-center text-[10px] font-bold text-primary-400">PNG</span>
                  Export as Image
                </button>
                <button
                  onClick={exportAsCsv}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-surface-600 transition-colors text-gray-300 hover:text-white border-t border-surface-600/50"
                >
                  <span className="w-5 text-center text-[10px] font-bold text-green-400">CSV</span>
                  Export as CSV
                </button>
                <button
                  onClick={exportAsJson}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-surface-600 transition-colors text-gray-300 hover:text-white border-t border-surface-600/50"
                >
                  <span className="w-5 text-center text-[10px] font-bold text-yellow-400">JSON</span>
                  Export as JSON
                </button>
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={() => { setSelectedSymbols([]); setChartData([]) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        {/* Custom date range */}
        {showCustomRange && period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-surface-700/50">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Date Range:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || undefined}
              className="input-field text-xs py-1.5 px-3 w-40"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart || undefined}
              max={new Date().toISOString().split('T')[0]}
              className="input-field text-xs py-1.5 px-3 w-40"
            />
            {customStart && customEnd && (
              <span className="text-[10px] text-gray-500">
                {Math.round((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24))} days
              </span>
            )}
          </div>
        )}

        {/* Active symbols chips */}
        {selectedSymbols.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-surface-700/50">
            <span className="text-xs text-gray-500 mr-1">Showing:</span>
            {selectedSymbols.map((s, i) => (
              <span
                key={s.symbol}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  borderColor: COLORS[i % COLORS.length] + '60',
                  backgroundColor: COLORS[i % COLORS.length] + '15',
                  color: COLORS[i % COLORS.length],
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {s.symbol}
                <button
                  onClick={() => removeSymbol(s.symbol)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="card" style={{ minHeight: 480 }}>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading data...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">Add symbols to start visualizing</p>
              <p className="text-gray-500 text-sm mt-1">Search for stocks, indices, ETFs, forex, or crypto above</p>
            </div>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={420}>
              <ChartComponent data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <defs>
                  {selectedSymbols.map((s, i) => (
                    <linearGradient key={s.symbol} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTickDate}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  minTickGap={60}
                />
                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                {shouldNormalize && <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />}
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Brush
                  dataKey="date"
                  height={28}
                  stroke="#475569"
                  fill="#0f172a"
                  tickFormatter={formatTickDate}
                />
                {selectedSymbols.map((s, i) => {
                  const color = COLORS[i % COLORS.length]
                  if (chartType === 'bar') {
                    return <Bar key={s.symbol} dataKey={s.symbol} fill={color} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                  }
                  if (chartType === 'line') {
                    return (
                      <Line
                        key={s.symbol}
                        type="monotone"
                        dataKey={s.symbol}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                        connectNulls
                      />
                    )
                  }
                  return (
                    <Area
                      key={s.symbol}
                      type="monotone"
                      dataKey={s.symbol}
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#grad-${i})`}
                      dot={false}
                      activeDot={{ r: 4, fill: color }}
                      connectNulls
                    />
                  )
                })}
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats cards */}
      {Object.keys(seriesMeta).length > 0 && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {selectedSymbols.map((s, i) => {
            const m = seriesMeta[s.symbol]
            if (!m) return null
            const color = COLORS[i % COLORS.length]
            const isUp = m.change >= 0
            return (
              <div key={s.symbol} className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-white">{s.symbol}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isUp ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {isUp ? '▲' : '▼'} {shouldNormalize ? `${m.change.toFixed(2)}%` : fmtCurrency(Math.abs(m.change))}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">
                    {shouldNormalize ? `${m.latest >= 0 ? '+' : ''}${m.latest.toFixed(2)}%` : fmtCurrency(m.latest)}
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Low: {shouldNormalize ? `${m.min.toFixed(1)}%` : fmtCurrency(m.min)}</span>
                    <span>High: {shouldNormalize ? `${m.max.toFixed(1)}%` : fmtCurrency(m.max)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick-add presets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Compare Presets</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Major Indices', symbols: [
              { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
              { symbol: '^DJI', name: 'Dow Jones', type: 'index' },
              { symbol: '^IXIC', name: 'NASDAQ', type: 'index' },
              { symbol: '^RUT', name: 'Russell 2000', type: 'index' },
            ]},
            { label: 'FAANG', symbols: [
              { symbol: 'META', name: 'Meta', type: 'stock' },
              { symbol: 'AAPL', name: 'Apple', type: 'stock' },
              { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
              { symbol: 'NFLX', name: 'Netflix', type: 'stock' },
              { symbol: 'GOOGL', name: 'Google', type: 'stock' },
            ]},
            { label: 'Commodities', symbols: [
              { symbol: 'GC=F', name: 'Gold', type: 'commodity' },
              { symbol: 'CL=F', name: 'Oil', type: 'commodity' },
              { symbol: 'SI=F', name: 'Silver', type: 'commodity' },
            ]},
            { label: 'Crypto', symbols: [
              { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
              { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
            ]},
            { label: 'Sector ETFs', symbols: [
              { symbol: 'XLK', name: 'Tech', type: 'etf' },
              { symbol: 'XLF', name: 'Financials', type: 'etf' },
              { symbol: 'XLE', name: 'Energy', type: 'etf' },
              { symbol: 'XLV', name: 'Healthcare', type: 'etf' },
              { symbol: 'XLRE', name: 'Real Estate', type: 'etf' },
            ]},
            { label: 'Mag 7', symbols: [
              { symbol: 'AAPL', name: 'Apple', type: 'stock' },
              { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
              { symbol: 'GOOGL', name: 'Google', type: 'stock' },
              { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
              { symbol: 'NVDA', name: 'Nvidia', type: 'stock' },
              { symbol: 'META', name: 'Meta', type: 'stock' },
              { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
            ]},
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setSelectedSymbols(preset.symbols); setNormalize(true) }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 hover:bg-primary-600/10 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
