import { BookOpen, Image, PenLine } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import { ThemeToggle } from './ThemeToggle'
import UserStatsBar from './UserStatsBar'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/90 border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          to="/"
          className="font-headline text-lg sm:text-xl tracking-widest text-foreground hover:text-primary transition-colors"
        >
          CATETIN
        </Link>

        {/* Center Navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/refleksi"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-foreground border-b-2 border-primary pb-1 px-2',
            }}
          >
            <PenLine size={14} className="sm:w-4 sm:h-4" />
            <span>Journal</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-foreground border-b-2 border-primary pb-1 px-2',
            }}
          >
            <BookOpen size={14} className="sm:w-4 sm:h-4" />
            <span>History</span>
          </Link>

          <button
            disabled
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground/50 cursor-not-allowed px-2 py-1"
            title="Coming Soon"
          >
            <Image size={14} className="sm:w-4 sm:h-4" />
            <span>Galeri</span>
          </button>
        </div>

        {/* Right side - Stats, Theme toggle & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          <UserStatsBar />
          <div className="w-px h-5 bg-border hidden sm:block" />
          <ThemeToggle />
          <ClerkHeader />
        </div>
      </nav>
    </header>
  )
}
