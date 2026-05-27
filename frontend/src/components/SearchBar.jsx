import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchStocks } from '../api'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await searchStocks(value)
        setResults(data.results || [])
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (symbol) => {
    setQuery('')
    setShowDropdown(false)
    navigate(`/stock/${symbol}`)
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search stocks, ETFs..."
          className="input-field w-full pl-9 pr-4 py-2 text-sm"
        />
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-700/50 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item.symbol)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-700/50 transition-colors text-left"
            >
              <div>
                <span className="font-medium text-sm text-white">{item.symbol}</span>
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.name}</p>
              </div>
              <span className="text-xs text-gray-500">{item.type}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-700/50 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-gray-400">
          Searching...
        </div>
      )}
    </div>
  )
}
