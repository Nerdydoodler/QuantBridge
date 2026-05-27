import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  List, Plus, X, Pencil, Trash2, Sparkles, Copy,
  TrendingUp, Brain, Cpu, Zap, Globe, Shield,
  BarChart3, Landmark, Fuel, Heart, Search,
} from 'lucide-react'
import {
  getLists, createList, deleteList, renameList,
  removeFromList, addToList,
} from '../store/pins'
import { suggestSymbols } from '../api'

const SUGGESTED_LISTS = [
  {
    id: 'ai-leaders',
    name: 'AI Leaders',
    description: 'Top companies driving artificial intelligence innovation',
    icon: 'Brain',
    items: [
      { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
      { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
      { symbol: 'TSM', name: 'TSMC', type: 'stock' },
    ],
  },
  {
    id: 'ai-infrastructure',
    name: 'AI Infrastructure & Chips',
    description: 'Semiconductor and cloud companies powering AI workloads',
    icon: 'Cpu',
    items: [
      { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
      { symbol: 'AMD', name: 'AMD', type: 'stock' },
      { symbol: 'AVGO', name: 'Broadcom', type: 'stock' },
      { symbol: 'MRVL', name: 'Marvell Technology', type: 'stock' },
      { symbol: 'ARM', name: 'ARM Holdings', type: 'stock' },
      { symbol: 'MU', name: 'Micron Technology', type: 'stock' },
    ],
  },
  {
    id: 'ai-software',
    name: 'AI Software & Applications',
    description: 'Companies building AI-powered software products',
    icon: 'Sparkles',
    items: [
      { symbol: 'PLTR', name: 'Palantir', type: 'stock' },
      { symbol: 'SNOW', name: 'Snowflake', type: 'stock' },
      { symbol: 'CRM', name: 'Salesforce', type: 'stock' },
      { symbol: 'ADBE', name: 'Adobe', type: 'stock' },
      { symbol: 'NOW', name: 'ServiceNow', type: 'stock' },
      { symbol: 'PANW', name: 'Palo Alto Networks', type: 'stock' },
    ],
  },
  {
    id: 'magnificent-7',
    name: 'Magnificent 7',
    description: 'The seven mega-cap tech stocks driving market returns',
    icon: 'Zap',
    items: [
      { symbol: 'AAPL', name: 'Apple', type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
      { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
      { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
      { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
    ],
  },
  {
    id: 'faang-plus',
    name: 'FAANG+',
    description: 'Classic FAANG stocks plus emerging tech leaders',
    icon: 'TrendingUp',
    items: [
      { symbol: 'META', name: 'Meta', type: 'stock' },
      { symbol: 'AAPL', name: 'Apple', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
      { symbol: 'NFLX', name: 'Netflix', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
      { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
    ],
  },
  {
    id: 'dividend-kings',
    name: 'Dividend Kings',
    description: '50+ years of consecutive dividend increases',
    icon: 'Landmark',
    items: [
      { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock' },
      { symbol: 'KO', name: 'Coca-Cola', type: 'stock' },
      { symbol: 'PG', name: 'Procter & Gamble', type: 'stock' },
      { symbol: 'MMM', name: '3M', type: 'stock' },
      { symbol: 'CL', name: 'Colgate-Palmolive', type: 'stock' },
      { symbol: 'EMR', name: 'Emerson Electric', type: 'stock' },
    ],
  },
  {
    id: 'clean-energy',
    name: 'Clean Energy',
    description: 'Solar, wind, EV, and renewable energy leaders',
    icon: 'Fuel',
    items: [
      { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
      { symbol: 'ENPH', name: 'Enphase Energy', type: 'stock' },
      { symbol: 'FSLR', name: 'First Solar', type: 'stock' },
      { symbol: 'NEE', name: 'NextEra Energy', type: 'stock' },
      { symbol: 'RIVN', name: 'Rivian', type: 'stock' },
      { symbol: 'PLUG', name: 'Plug Power', type: 'stock' },
    ],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Companies protecting digital infrastructure',
    icon: 'Shield',
    items: [
      { symbol: 'CRWD', name: 'CrowdStrike', type: 'stock' },
      { symbol: 'PANW', name: 'Palo Alto Networks', type: 'stock' },
      { symbol: 'ZS', name: 'Zscaler', type: 'stock' },
      { symbol: 'FTNT', name: 'Fortinet', type: 'stock' },
      { symbol: 'S', name: 'SentinelOne', type: 'stock' },
      { symbol: 'NET', name: 'Cloudflare', type: 'stock' },
    ],
  },
  {
    id: 'healthcare-innovation',
    name: 'Healthcare Innovation',
    description: 'Biotech and healthcare technology disruptors',
    icon: 'Heart',
    items: [
      { symbol: 'LLY', name: 'Eli Lilly', type: 'stock' },
      { symbol: 'UNH', name: 'UnitedHealth', type: 'stock' },
      { symbol: 'ISRG', name: 'Intuitive Surgical', type: 'stock' },
      { symbol: 'DXCM', name: 'DexCom', type: 'stock' },
      { symbol: 'MRNA', name: 'Moderna', type: 'stock' },
      { symbol: 'VEEV', name: 'Veeva Systems', type: 'stock' },
    ],
  },
  {
    id: 'global-etfs',
    name: 'Global Diversification ETFs',
    description: 'Low-cost ETFs for broad market exposure',
    icon: 'Globe',
    items: [
      { symbol: 'SPY', name: 'S&P 500 ETF', type: 'etf' },
      { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'etf' },
      { symbol: 'VTI', name: 'Total Stock Market', type: 'etf' },
      { symbol: 'VXUS', name: 'International Stocks', type: 'etf' },
      { symbol: 'BND', name: 'Total Bond Market', type: 'etf' },
      { symbol: 'GLD', name: 'Gold ETF', type: 'etf' },
    ],
  },
]

const ICON_MAP = { Brain, Cpu, Sparkles, Zap, TrendingUp, Landmark, Fuel, Shield, Heart, Globe }

export default function ListsPage() {
  const [lists, setLists] = useState(getLists())
  const [activeTab, setActiveTab] = useState('my-lists')
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingList, setEditingList] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [addingTo, setAddingTo] = useState(null)
  const [stockQuery, setStockQuery] = useState('')
  const [stockSuggestions, setStockSuggestions] = useState([])
  const [stockSearchLoading, setStockSearchLoading] = useState(false)
  const addRef = useRef(null)
  const debounceRef = useRef(null)

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
    if (!name.trim()) return
    const updated = renameList(id, name.trim())
    setLists(updated)
    setEditingList(null)
  }

  const handleRemoveFromList = (listId, symbol) => {
    const updated = removeFromList(listId, symbol)
    setLists(updated)
  }

  // Stock search for adding to lists
  useEffect(() => {
    if (!stockQuery || stockQuery.length < 1) {
      setStockSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setStockSearchLoading(true)
      try {
        const res = await suggestSymbols(stockQuery)
        setStockSuggestions(res.data || [])
      } catch {
        setStockSuggestions([])
      }
      setStockSearchLoading(false)
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [stockQuery])

  useEffect(() => {
    const handler = (e) => {
      if (addRef.current && !addRef.current.contains(e.target)) {
        setAddingTo(null)
        setStockQuery('')
        setStockSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAddStock = (listId, item) => {
    const updated = addToList(listId, { symbol: item.symbol, name: item.name, type: item.type || 'stock' })
    setLists(updated)
    setStockQuery('')
    setStockSuggestions([])
  }

  const handleCopySuggested = (suggested) => {
    const updated = createList(suggested.name)
    const newList = updated[updated.length - 1]
    let latestLists = updated
    suggested.items.forEach(item => {
      latestLists = addToList(newList.id, item)
    })
    setLists(latestLists)
    setCopiedId(suggested.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const tabs = [
    { id: 'my-lists', label: 'My Lists' },
    { id: 'suggested', label: 'Suggested Lists' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <List className="w-7 h-7 text-primary-400" />
            Lists
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create, manage, and discover curated stock lists</p>
        </div>
        <button onClick={() => { setActiveTab('my-lists'); setShowNewList(true) }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors">
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-700/50">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-400 text-primary-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Lists Tab */}
      {activeTab === 'my-lists' && (
        <div className="space-y-4">
          {/* New list input */}
          {showNewList && (
            <div className="card flex items-center gap-2">
              <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateList()} placeholder="List name (e.g., Growth Picks, AI Watchlist)..." className="input-field flex-1 text-sm" autoFocus />
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
                      <input type="text" defaultValue={list.name} onBlur={(e) => handleRenameList(list.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameList(list.id, e.target.value)} className="input-field text-sm flex-1 mr-2" autoFocus />
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
                    <p className="text-xs text-gray-500 py-4 text-center">No items yet. Add stocks from the stock detail page or copy a suggested list.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {list.items.map((item) => (
                        <div key={item.symbol} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-700/50 group">
                          <Link to={`/stock/${item.symbol}`} className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-xs font-bold text-white">{item.symbol}</span>
                            <span className="text-[11px] text-gray-500 truncate">{item.name}</span>
                          </Link>
                          <button onClick={() => handleRemoveFromList(list.id, item.symbol)} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-600 text-gray-500 hover:text-red-400 transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add stock input */}
                  <div className="mt-3 pt-3 border-t border-surface-700/50">
                    {addingTo === list.id ? (
                      <div ref={addRef} className="relative">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="text"
                            value={stockQuery}
                            onChange={(e) => setStockQuery(e.target.value)}
                            placeholder="Search by ticker or name..."
                            className="input-field w-full pl-8 pr-8 text-xs py-1.5"
                            autoFocus
                          />
                          {stockSearchLoading && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {stockQuery.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                            {stockSuggestions.length > 0 ? (
                              stockSuggestions.map((s, i) => {
                                const already = list.items.find(it => it.symbol === s.symbol)
                                return (
                                  <button
                                    key={i}
                                    onClick={() => !already && handleAddStock(list.id, s)}
                                    disabled={already}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-600 transition-colors text-xs ${
                                      already ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    <span className="font-mono font-bold text-white min-w-[60px]">{s.symbol}</span>
                                    <span className="text-gray-400 flex-1 truncate">{s.name}</span>
                                    {already && <span className="text-[10px] text-gray-500">Added</span>}
                                  </button>
                                )
                              })
                            ) : (
                              !stockSearchLoading && (
                                <div className="px-3 py-2 text-xs text-gray-500">No results found</div>
                              )
                            )}
                            {stockQuery.length >= 1 && !stockSuggestions.find(s => s.symbol.toUpperCase() === stockQuery.toUpperCase()) && (
                              <button
                                onClick={() => handleAddStock(list.id, { symbol: stockQuery.toUpperCase(), name: stockQuery.toUpperCase(), type: 'stock' })}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-600 border-t border-surface-600 transition-colors text-xs"
                              >
                                <Plus className="w-3 h-3 text-primary-400" />
                                <span className="text-gray-300">Add <span className="font-mono font-bold text-white">{stockQuery.toUpperCase()}</span> directly</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">{list.items.length} item{list.items.length !== 1 ? 's' : ''}</span>
                        <button
                          onClick={() => { setAddingTo(list.id); setStockQuery(''); setStockSuggestions([]) }}
                          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !showNewList && (
            <div className="card text-center py-12">
              <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-lg text-gray-400 font-medium">No lists yet</p>
              <p className="text-sm text-gray-500 mt-1">Create a list to organize and track custom groups of stocks</p>
              <button onClick={() => setShowNewList(true)} className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors">Create Your First List</button>
            </div>
          )}
        </div>
      )}

      {/* Suggested Lists Tab */}
      {activeTab === 'suggested' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Popular stock combinations curated for common investment strategies. Click to add any of these to your lists.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SUGGESTED_LISTS.map((suggested) => {
              const IconComp = ICON_MAP[suggested.icon] || List
              return (
                <div key={suggested.id} className="card hover:border-primary-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{suggested.name}</h3>
                        <p className="text-[11px] text-gray-500">{suggested.items.length} stocks</p>
                      </div>
                    </div>
                    <button onClick={() => handleCopySuggested(suggested)} className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${copiedId === suggested.id ? 'bg-green-600/20 border-green-500/50 text-green-300' : 'border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50'}`}>
                      <Copy className="w-3 h-3" />
                      {copiedId === suggested.id ? 'Added!' : 'Add to My Lists'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{suggested.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggested.items.map((item) => (
                      <Link key={item.symbol} to={`/stock/${item.symbol}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-700/50 hover:bg-surface-600 text-xs font-mono transition-colors">
                        <span className="font-bold text-white">{item.symbol}</span>
                        <span className="text-gray-500 hidden sm:inline">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}