import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'catetin-theme'

/**
 * Hook for managing theme state (light/dark mode)
 * Persists preference to localStorage and applies .dark class to document
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Default to light, will be corrected in useEffect if needed
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light'
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}

/**
 * Initialize theme on app startup (call once at root level)
 * This prevents flash of wrong theme on page load
 */
export function initializeTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  
  const root = document.documentElement
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  const theme = stored || 'light'
  
  // Temporarily disable transitions to prevent flash
  root.classList.add('no-transitions')
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  
  // Re-enable transitions after a brief delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('no-transitions')
    })
  })
  
  return theme
}
