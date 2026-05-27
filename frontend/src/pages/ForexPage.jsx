import { useState, useEffect } from 'react'
import { DollarSign, ArrowRight } from 'lucide-react'
import { getMajorPairs, convertCurrency } from '../api'
import SortableTable from '../components/SortableTable'

export default function ForexPage() {
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [convertFrom, setConvertFrom] = useState('USD')
  const [convertTo, setConvertTo] = useState('EUR')
  const [amount, setAmount] = useState('1000')
  const [convertResult, setConvertResult] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getMajorPairs()
        setPairs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleConvert = async () => {
    try {
      const { data } = await convertCurrency(parseFloat(amount), convertFrom, convertTo)
      setConvertResult(data)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading forex data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Foreign Exchange</h1>

      {/* Currency Converter */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Currency Converter</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field w-32"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input
              type="text"
              value={convertFrom}
              onChange={(e) => setConvertFrom(e.target.value.toUpperCase())}
              className="input-field w-20"
              maxLength={3}
            />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 mb-2" />
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input
              type="text"
              value={convertTo}
              onChange={(e) => setConvertTo(e.target.value.toUpperCase())}
              className="input-field w-20"
              maxLength={3}
            />
          </div>
          <button onClick={handleConvert} className="btn-primary">
            Convert
          </button>
        </div>
        {convertResult && !convertResult.error && (
          <div className="mt-4 p-3 bg-surface-700/30 rounded-lg">
            <p className="text-lg font-bold">
              {convertResult.amount.toLocaleString()} {convertResult.from} ={' '}
              <span className="text-primary-300">{convertResult.converted.toLocaleString()} {convertResult.to}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Rate: 1 {convertResult.from} = {convertResult.rate} {convertResult.to}</p>
          </div>
        )}
      </div>

      {/* Major Pairs */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4">Major Currency Pairs</h2>
        <SortableTable
          rowKey={(row, idx) => row.pair || idx}
          columns={[
            { key: 'pair', label: 'Pair', sortValue: (r) => r.pair, render: (r) => <span className="font-medium">{r.pair}</span> },
            { key: 'price', label: 'Price', align: 'right', sortValue: (r) => r.price || 0, render: (r) => r.price?.toFixed(5) || 'N/A' },
            { key: 'change', label: 'Change', align: 'right', sortValue: (r) => r.change || 0, render: (r) => <span className={(r.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>{r.change?.toFixed(5) || '-'}</span> },
            { key: 'change_percent', label: 'Change %', align: 'right', sortValue: (r) => r.change_percent || 0, render: (r) => <span className={(r.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>{r.change_percent ? `${r.change_percent}%` : '-'}</span> },
            { key: 'day_high', label: 'Day High', align: 'right', sortValue: (r) => r.day_high || 0, render: (r) => <span className="text-gray-400">{r.day_high?.toFixed(5) || '-'}</span> },
            { key: 'day_low', label: 'Day Low', align: 'right', sortValue: (r) => r.day_low || 0, render: (r) => <span className="text-gray-400">{r.day_low?.toFixed(5) || '-'}</span> },
          ]}
          data={pairs}
        />
      </div>
    </div>
  )
}
