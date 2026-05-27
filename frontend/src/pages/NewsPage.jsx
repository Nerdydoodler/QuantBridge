import { useState, useEffect, useMemo } from 'react'
import { Bitcoin, TrendingUp, Search, X, Filter, Clock, Globe } from 'lucide-react'
import { getMarketNews, getCryptoNews } from '../api'

const TIMEFRAMES = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last Hour', ms: 60 * 60 * 1000 },
  { value: '6h', label: 'Last 6 Hours', ms: 6 * 60 * 60 * 1000 },
  { value: '24h', label: 'Last 24 Hours', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Last 7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Last 30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
]

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export default function NewsPage() {
  const [marketNews, setMarketNews] = useState([])
  const [cryptoNews, setCryptoNews] = useState([])
  const [activeTab, setActiveTab] = useState('market')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [timeframe, setTimeframe] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchNews() {
      try {
        const [mRes, cRes] = await Promise.allSettled([
          getMarketNews(100),
          getCryptoNews(60),
        ])
        if (mRes.status === 'fulfilled') setMarketNews(mRes.value.data)
        if (cRes.status === 'fulfilled') setCryptoNews(cRes.value.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const rawArticles = activeTab === 'market' ? marketNews : cryptoNews

  // Extract unique sources
  const sources = useMemo(() => {
    const set = new Set()
    rawArticles.forEach(a => { if (a.source) set.add(a.source) })
    return Array.from(set).sort()
  }, [rawArticles])

  // Filter articles
  const filtered = useMemo(() => {
    const now = Date.now()
    const tf = TIMEFRAMES.find(t => t.value === timeframe)
    const query = searchQuery.toLowerCase().trim()

    return rawArticles.filter(article => {
      // Keyword search
      if (query) {
        const title = (article.title || '').toLowerCase()
        const summary = (article.summary || '').toLowerCase()
        const source = (article.source || '').toLowerCase()
        if (!title.includes(query) && !summary.includes(query) && !source.includes(query)) {
          return false
        }
      }

      // Source filter
      if (selectedSource !== 'all' && article.source !== selectedSource) {
        return false
      }

      // Timeframe filter
      if (tf && tf.ms) {
        const pubDate = parseDate(article.published)
        if (!pubDate || (now - pubDate.getTime()) > tf.ms) {
          return false
        }
      }

      return true
    })
  }, [rawArticles, searchQuery, selectedSource, timeframe])

  const activeFilterCount = (selectedSource !== 'all' ? 1 : 0) + (timeframe !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSource('all')
    setTimeframe('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading news...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News Feed</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              activeTab === 'market' ? 'bg-primary-600 text-white' : 'bg-surface-700/50 text-gray-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Market
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              activeTab === 'crypto' ? 'bg-primary-600 text-white' : 'bg-surface-700/50 text-gray-400'
            }`}
          >
            <Bitcoin className="w-3.5 h-3.5" />
            Crypto
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Keyword search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by keyword..."
              className="input-field w-full pl-10 pr-9 text-sm py-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-600 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                : 'border-surface-600 text-gray-400 hover:text-white hover:border-surface-500'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap items-start gap-4 pt-3 border-t border-surface-700/50">
            {/* Source filter */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <Globe className="w-3 h-3" />
                Source
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedSource('all')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${
                    selectedSource === 'all'
                      ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                      : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                  }`}
                >
                  All Sources
                </button>
                {sources.map((src) => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(selectedSource === src ? 'all' : src)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${
                      selectedSource === src
                        ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                        : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe filter */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <Clock className="w-3 h-3" />
                Timeframe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${
                      timeframe === tf.value
                        ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                        : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            {(searchQuery || activeFilterCount > 0) && ` matching filters`}
          </span>
          {searchQuery && (
            <span>
              Searching for: <span className="text-primary-400 font-medium">"{searchQuery}"</span>
            </span>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.map((article, idx) => {
          const query = searchQuery.toLowerCase().trim()
          return (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card block hover:border-primary-500/30 transition-colors"
            >
              <h3 className="text-sm font-medium text-gray-200">
                {query ? highlightText(article.title, query) : article.title}
              </h3>
              {article.summary && (
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                  {query ? highlightText(article.summary, query) : article.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-primary-400 font-medium">{article.source}</span>
                {article.published && (
                  <span className="text-xs text-gray-500">{formatRelativeTime(article.published)}</span>
                )}
              </div>
            </a>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {searchQuery || activeFilterCount > 0
              ? 'No articles match your filters. Try adjusting your search or filters.'
              : 'No news articles available'}
          </div>
        )}
      </div>
    </div>
  )
}

function highlightText(text, query) {
  if (!query || !text) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-primary-500/30 text-primary-200 rounded px-0.5">{part}</mark>
      : part
  )
}

function formatRelativeTime(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr?.slice(0, 25) || ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}
