// Settings store with localStorage persistence

const SETTINGS_KEY = 'quantbridge_settings'

const DEFAULTS = {
  currency: 'USD',       // 'USD' | 'EUR' | 'GBP' | 'JPY' | etc.
  theme: 'dark',          // 'dark' | 'light'
  colorblind: 'none',    // 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
  textScale: 100,        // 75 | 100 | 125 | 150
}

export function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return { ...DEFAULTS, ...saved }
  } catch {
    return { ...DEFAULTS }
  }
}

export function updateSettings(partial) {
  const current = getSettings()
  const updated = { ...current, ...partial }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  applySettings(updated)
  return updated
}

export function applySettings(settings) {
  const s = settings || getSettings()
  const root = document.documentElement

  // Theme
  if (s.theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
  }

  // Text scale
  root.style.fontSize = `${s.textScale}%`

  // Colorblind mode - apply CSS filter
  const body = document.body
  body.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia')
  if (s.colorblind !== 'none') {
    body.classList.add(`cb-${s.colorblind}`)
  }
}

// Initialize on load
export function initSettings() {
  applySettings()
}
