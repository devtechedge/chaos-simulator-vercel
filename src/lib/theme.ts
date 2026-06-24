// Theme — dark/light mode with localStorage persistence
"use client"

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'
const STORAGE_KEY = 'chaos-simulator:theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored)
        applyTheme(stored)
      } else {
        const prefersLight =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-color-scheme: light)').matches
        const initial: Theme = prefersLight ? 'light' : 'dark'
        setThemeState(initial)
        applyTheme(initial)
      }
    } catch {
      applyTheme('dark')
    }
    setHydrated(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle, hydrated }
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}
