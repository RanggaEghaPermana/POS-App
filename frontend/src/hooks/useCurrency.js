import { useEffect, useState } from 'react'

export default function useCurrency(defaultCurrency = 'IDR') {
  const initial = (typeof window !== 'undefined' && window.__APP_CURRENCY__) || defaultCurrency
  const [currency, setCurrency] = useState(initial)

  useEffect(() => {
    function applyFromWindow() {
      if (typeof window !== 'undefined' && window.__APP_CURRENCY__) {
        setCurrency(window.__APP_CURRENCY__)
      }
    }
    function onConfigUpdated(e) {
      const cfg = e?.detail
      if (cfg && cfg.currency) {
        setCurrency(cfg.currency)
      } else {
        applyFromWindow()
      }
    }
    function onSettingsUpdated(e) {
      const s = e?.detail
      if (s && typeof s.currency === 'string') {
        setCurrency(s.currency)
      } else if (s && s.currency?.currency) {
        // in case structure differs
        setCurrency(s.currency.currency)
      } else {
        applyFromWindow()
      }
    }
    window.addEventListener('app:config-updated', onConfigUpdated)
    window.addEventListener('app:settings-updated', onSettingsUpdated)
    return () => {
      window.removeEventListener('app:config-updated', onConfigUpdated)
      window.removeEventListener('app:settings-updated', onSettingsUpdated)
    }
  }, [])

  return currency || defaultCurrency
}

