import os

path = r'c:\Users\nerdy\CascadeProjects\TestBB\frontend\src\components\SettingsPanel.jsx'

content = r"""import { useState, useEffect, useRef } from 'react'
import { Settings, X, Sun, Moon, Eye, Type, Monitor } from 'lucide-react'
import { getSettings, updateSettings } from '../store/settings'

const THEMES = [
  { value: 'dark', label: 'Dark', icon: 'Moon' },
  { value: 'light', label: 'Light', icon: 'Sun' },
]

const COLORBLIND_MODES = [
  { value: 'none', label: 'None' },
  { value: 'deuteranopia', label: 'Deuteranopia (Red-Green)' },
  { value: 'protanopia', label: 'Protanopia (Red-Weak)' },
  { value: 'tritanopia', label: 'Tritanopia (Blue-Yellow)' },
]

const TEXT_SCALES = [
  { value: 75, label: 'Small' },
  { value: 100, label: 'Default' },
  { value: 125, label: 'Large' },
  { value: 150, label: 'Extra Large' },
]

export default function SettingsPanel({ open, onClose }) {
  const [settings, setSettings] = useState(getSettings())
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const update = (key, value) => {
    const updated = updateSettings({ [key]: value })
    setSettings(updated)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative w-full max-w-sm bg-surface-800 border-l border-surface-700/50 shadow-2xl overflow-y-auto animate-slide-in"
      >
        <div className="sticky top-0 bg-surface-800 border-b border-surface-700/50 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Appearance</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update('theme', t.value)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    settings.theme === t.value
                      ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                      : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                  }`}
                >
                  {t.value === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colorblind Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Colorblind Mode</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Adjust colors for better visibility with color vision deficiencies.</p>
            <div className="space-y-2">
              {COLORBLIND_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => update('colorblind', mode.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    settings.colorblind === mode.value
                      ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                      : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Scaling */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Text Size</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Scale text throughout the application for readability.</p>
            <div className="grid grid-cols-2 gap-2">
              {TEXT_SCALES.map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => update('textScale', scale.value)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    settings.textScale === scale.value
                      ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                      : 'border-surface-600 text-gray-400 hover:border-surface-500 hover:text-white'
                  }`}
                >
                  {scale.label}
                  <span className="block text-[10px] text-gray-500 mt-0.5">{scale.value}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-surface-700/50 pt-6">
            <p className="text-xs text-gray-500">Changes are applied immediately and saved automatically.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content.strip())
print('SettingsPanel.jsx written')
