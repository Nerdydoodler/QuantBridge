path = r'c:\Users\nerdy\CascadeProjects\TestBB\frontend\src\components\Layout.jsx'

content = r"""import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  Bitcoin,
  DollarSign,
  Newspaper,
  Menu,
  Activity,
  Layers,
  List,
  Settings,
} from 'lucide-react'
import SearchBar from './SearchBar'
import SettingsPanel from './SettingsPanel'
import ColorblindFilters from './ColorblindFilters'
import { initSettings } from '../store/settings'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/lists', label: 'Lists', icon: List },
  { path: '/analytics', label: 'Analytics', icon: Layers },
  { path: '/crypto', label: 'Crypto', icon: Bitcoin },
  { path: '/forex', label: 'Forex', icon: DollarSign },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/screener', label: 'Screener', icon: TrendingUp },
]

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    initSettings()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <ColorblindFilters />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-800 border-r border-surface-700/50 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 p-5 border-b border-surface-700/50">
          <Activity className="w-7 h-7 text-primary-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
            QuantBridge
          </span>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-700/50'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="card text-xs text-gray-500">
            <p className="font-medium text-gray-400 mb-1">QuantBridge v1.0</p>
            <p>Private Financial Platform</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-3 bg-surface-800/80 backdrop-blur border-b border-surface-700/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <SearchBar />

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
"""

import os
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content.strip())
print('Layout.jsx written')
