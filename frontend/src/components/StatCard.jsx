import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, change, prefix = '$', suffix = '' }) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="card">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-xl font-bold text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}%
          </span>
        </div>
      )}
    </div>
  )
}
