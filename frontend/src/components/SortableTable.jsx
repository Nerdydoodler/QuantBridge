import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export default function SortableTable({ columns, data, onRowClick, rowKey }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(colKey)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0
    const col = columns.find(c => c.key === sortCol)
    if (!col) return 0

    let aVal = col.sortValue ? col.sortValue(a) : a[sortCol]
    let bVal = col.sortValue ? col.sortValue(b) : b[sortCol]

    if (aVal == null) aVal = sortDir === 'asc' ? Infinity : -Infinity
    if (bVal == null) bVal = sortDir === 'asc' ? Infinity : -Infinity

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-500 border-b border-surface-700/50">
          {columns.map((col) => (
            <th
              key={col.key}
              className={`py-3 px-2 select-none ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                col.sortable !== false ? 'cursor-pointer hover:text-gray-300 transition-colors' : ''
              }`}
              onClick={() => col.sortable !== false && handleSort(col.key)}
            >
              <span className="inline-flex items-center gap-1">
                {col.label}
                {col.sortable !== false && (
                  sortCol === col.key ? (
                    sortDir === 'asc'
                      ? <ChevronUp className="w-3 h-3 text-primary-400" />
                      : <ChevronDown className="w-3 h-3 text-primary-400" />
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 opacity-30" />
                  )
                )}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, idx) => (
          <tr
            key={rowKey ? rowKey(row, idx) : idx}
            className={`border-b border-surface-700/30 hover:bg-surface-700/30 transition-colors ${
              onRowClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onRowClick && onRowClick(row, idx)}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`py-3 px-2 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}
              >
                {col.render ? col.render(row, idx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
