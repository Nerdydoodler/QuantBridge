import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getCryptoPrices, getTrendingCrypto } from '../api'
import useCurrency from '../hooks/useCurrency'
import SortableTable from '../components/SortableTable'

export default function CryptoPage() {
  const { convert, symbol: currSym } = useCurrency()
  const [prices, setPrices] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, tRes] = await Promise.allSettled([
          getCryptoPrices('bitcoin,ethereum,solana,cardano,polkadot,avalanche-2,chainlink,polygon,uniswap,litecoin'),
          getTrendingCrypto(),
        ])
        if (pRes.status === 'fulfilled') setPrices(pRes.value.data)
        if (tRes.status === 'fulfilled') setTrending(tRes.value.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading crypto data...</div>
      </div>
    )
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    const p = convert(price)
    if (p >= 1) return `${currSym}${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    return `${currSym}${p.toFixed(6)}`
  }

  const formatCap = (cap) => {
    if (!cap) return 'N/A'
    const c = convert(cap)
    if (c >= 1e12) return `${currSym}${(c / 1e12).toFixed(2)}T`
    if (c >= 1e9) return `${currSym}${(c / 1e9).toFixed(2)}B`
    if (c >= 1e6) return `${currSym}${(c / 1e6).toFixed(2)}M`
    return `${currSym}${c.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cryptocurrency</h1>

      {/* Prices table */}
      <div className="card overflow-x-auto">
        <SortableTable
          rowKey={(row) => row.id}
          columns={[
            { key: 'rank', label: '#', sortValue: (r) => prices.indexOf(r), render: (r) => <span className="text-gray-500">{prices.indexOf(r) + 1}</span> },
            { key: 'name', label: 'Name', sortValue: (r) => r.name?.toLowerCase(), render: (r) => (
              <div className="flex items-center gap-2">
                {r.image && <img src={r.image} alt="" className="w-5 h-5 rounded-full" />}
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-gray-500">{r.symbol}</span>
              </div>
            )},
            { key: 'price', label: 'Price', align: 'right', sortValue: (r) => r.price || 0, render: (r) => <span className="font-medium">{formatPrice(r.price)}</span> },
            { key: 'change_1h', label: '1h', align: 'right', sortValue: (r) => r.change_1h || 0, render: (r) => <span className={`text-xs ${(r.change_1h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r.change_1h ? `${r.change_1h.toFixed(2)}%` : '-'}</span> },
            { key: 'change_24h', label: '24h', align: 'right', sortValue: (r) => r.change_24h || 0, render: (r) => <span className={`text-xs ${(r.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r.change_24h ? `${r.change_24h.toFixed(2)}%` : '-'}</span> },
            { key: 'change_7d', label: '7d', align: 'right', sortValue: (r) => r.change_7d || 0, render: (r) => <span className={`text-xs ${(r.change_7d || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r.change_7d ? `${r.change_7d.toFixed(2)}%` : '-'}</span> },
            { key: 'market_cap', label: 'Market Cap', align: 'right', sortValue: (r) => r.market_cap || 0, render: (r) => <span className="text-gray-300">{formatCap(r.market_cap)}</span> },
            { key: 'volume_24h', label: 'Volume (24h)', align: 'right', sortValue: (r) => r.volume_24h || 0, render: (r) => <span className="text-gray-400">{formatCap(r.volume_24h)}</span> },
          ]}
          data={prices}
        />
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold mb-3">Trending</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {trending.map((coin, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-surface-700/30">
                {coin.thumb && <img src={coin.thumb} alt="" className="w-6 h-6 rounded-full" />}
                <div>
                  <p className="text-xs font-medium">{coin.name}</p>
                  <p className="text-xs text-gray-500">{coin.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
