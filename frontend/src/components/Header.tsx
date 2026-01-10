import { useState } from 'react'
import { BookOpen, Image, Menu, PenLine, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import { ThemeToggle } from './ThemeToggle'
import UserStatsBar from './UserStatsBar'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

        {/* Center Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/refleksi"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground border-b-2 border-primary pb-1 px-2',
            }}
          >
            <PenLine size={16} />
            <span>Journal</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground border-b-2 border-primary pb-1 px-2',
            }}
          >
            <BookOpen size={16} />
            <span>History</span>
          </Link>

          <button
            disabled
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground/50 cursor-not-allowed px-2 py-1"
            title="Coming Soon"
          >
            <Image size={16} />
            <span>Galeri</span>
          </button>
        </div>

        {/* Right side - Stats, Theme toggle & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          <UserStatsBar />
          <div className="w-px h-5 bg-border hidden sm:block" />
          <ThemeToggle />
          <ClerkHeader />

          {/* Hamburger Menu Button - Mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel - Slide from right */}
          <div className="absolute right-0 top-0 h-full w-72 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-headline text-lg tracking-widest text-foreground">
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-foreground hover:text-primary transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col p-4 gap-2">
              <Link
                to="/refleksi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors px-4 py-3 rounded-lg"
                activeProps={{
                  className:
                    'flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-foreground bg-primary/10 border-l-2 border-primary px-4 py-3 rounded-lg',
                }}
              >
                <PenLine size={18} />
                <span>Journal</span>
              </Link>

              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors px-4 py-3 rounded-lg"
                activeProps={{
                  className:
                    'flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-foreground bg-primary/10 border-l-2 border-primary px-4 py-3 rounded-lg',
                }}
              >
                <BookOpen size={18} />
                <span>History</span>
              </Link>

              <button
                disabled
                className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-muted-foreground/50 cursor-not-allowed px-4 py-3 rounded-lg"
                title="Coming Soon"
              >
                <Image size={18} />
                <span>Galeri</span>
                <span className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded">
                  Soon
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-border" />

            {/* Footer info */}
            <div className="p-4">
              <p className="font-mono text-xs text-muted-foreground">
                Catetin - Your Journaling Companion
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
