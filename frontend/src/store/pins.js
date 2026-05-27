// Local storage-based store for pinned items and custom lists

const PINS_KEY = 'quantbridge_pins'
const LISTS_KEY = 'quantbridge_lists'

// --- Pinned Items ---

export function getPinnedStocks() {
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY + '_stocks') || '[]')
  } catch { return [] }
}

export function pinStock(symbol, name = '') {
  const pins = getPinnedStocks()
  if (!pins.find(p => p.symbol === symbol)) {
    pins.push({ symbol, name, pinnedAt: Date.now() })
    localStorage.setItem(PINS_KEY + '_stocks', JSON.stringify(pins))
  }
  return pins
}

export function unpinStock(symbol) {
  const pins = getPinnedStocks().filter(p => p.symbol !== symbol)
  localStorage.setItem(PINS_KEY + '_stocks', JSON.stringify(pins))
  return pins
}

export function isStockPinned(symbol) {
  return getPinnedStocks().some(p => p.symbol === symbol)
}

// --- Pinned Analytics (chart comparisons) ---

export function getPinnedCharts() {
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY + '_charts') || '[]')
  } catch { return [] }
}

export function pinChart(chart) {
  // chart: { id, name, symbols: [{symbol, name, type}], period }
  const charts = getPinnedCharts()
  const id = chart.id || `chart_${Date.now()}`
  charts.push({ ...chart, id, pinnedAt: Date.now() })
  localStorage.setItem(PINS_KEY + '_charts', JSON.stringify(charts))
  return charts
}

export function unpinChart(id) {
  const charts = getPinnedCharts().filter(c => c.id !== id)
  localStorage.setItem(PINS_KEY + '_charts', JSON.stringify(charts))
  return charts
}

// --- Custom Lists ---

export function getLists() {
  try {
    return JSON.parse(localStorage.getItem(LISTS_KEY) || '[]')
  } catch { return [] }
}

export function createList(name) {
  const lists = getLists()
  const id = `list_${Date.now()}`
  lists.push({ id, name, items: [], createdAt: Date.now() })
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  return lists
}

export function deleteList(id) {
  const lists = getLists().filter(l => l.id !== id)
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  return lists
}

export function renameList(id, newName) {
  const lists = getLists()
  const list = lists.find(l => l.id === id)
  if (list) list.name = newName
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  return lists
}

export function addToList(listId, item) {
  // item: { symbol, name, type }
  const lists = getLists()
  const list = lists.find(l => l.id === listId)
  if (list && !list.items.find(i => i.symbol === item.symbol)) {
    list.items.push({ ...item, addedAt: Date.now() })
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  }
  return lists
}

export function removeFromList(listId, symbol) {
  const lists = getLists()
  const list = lists.find(l => l.id === listId)
  if (list) {
    list.items = list.items.filter(i => i.symbol !== symbol)
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  }
  return lists
}

export function getList(id) {
  return getLists().find(l => l.id === id) || null
}
