import { useState, useEffect, useCallback } from 'react'
import { getSettings } from '../store/settings'
import { getForexQuote } from '../api'

const CACHE_KEY = 'quantbridge_fx_cache'
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

const SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'Fr',
  INR: '₹',
  CNY: '¥',
  BRL: 'R$',
}

function getCachedRate(currency) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    const entry = cache[currency]
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
      return entry.rate
    }
  } catch {}
  return null
}

function setCachedRate(currency, rate) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    cache[currency] = { rate, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export default function useCurrency() {
  const [currency, setCurrency] = useState(getSettings().currency || 'USD')
  const [rate, setRate] = useState(currency === 'USD' ? 1 : (getCachedRate(currency) || 1))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkCurrency = () => {
      const current = getSettings().currency || 'USD'
      if (current !== currency) {
        setCurrency(current)
      }
    }

    // Poll for settings changes (simple approach, no context needed)
    const interval = setInterval(checkCurrency, 500)
    return () => clearInterval(interval)
  }, [currency])

  useEffect(() => {
    if (currency === 'USD') {
      setRate(1)
      return
    }

    const cached = getCachedRate(currency)
    if (cached) {
      setRate(cached)
      return
    }

    setLoading(true)
    getForexQuote('USD', currency)
      .then((res) => {
        const r = res.data?.rate || res.data?.price || 1
        setRate(r)
        setCachedRate(currency, r)
      })
      .catch(() => {
        // Fallback: keep rate at 1 if fetch fails
        setRate(1)
      })
      .finally(() => setLoading(false))
  }, [currency])

  const convert = useCallback((usdAmount) => {
    if (usdAmount == null) return null
    return usdAmount * rate
  }, [rate])

  const format = useCallback((usdAmount, opts = {}) => {
    if (usdAmount == null) return 'N/A'
    const converted = usdAmount * rate
    const { decimals = 2, showSymbol = true } = opts
    const sym = showSymbol ? (SYMBOLS[currency] || '$') : ''
    return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }, [rate, currency])

  return {
    currency,
    symbol: SYMBOLS[currency] || '$',
    rate,
    loading,
    convert,
    format,
  }
}
