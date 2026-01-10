import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks'

/**
 * Theme toggle button with animated sun/moon icons
 * Switches between light and dark mode
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-full 
                 bg-muted/50 hover:bg-muted border border-border
                 transition-all duration-300 ease-out
                 hover:scale-105 active:scale-95"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon - visible in dark mode */}
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ease-out
                   ${isDark 
                     ? 'opacity-100 rotate-0 scale-100' 
                     : 'opacity-0 -rotate-90 scale-0'
                   } text-primary`}
      />
      {/* Moon icon - visible in light mode */}
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ease-out
                   ${isDark 
                     ? 'opacity-0 rotate-90 scale-0' 
                     : 'opacity-100 rotate-0 scale-100'
                   } text-foreground`}
      />
    </button>
  )
}

export default ThemeToggle
