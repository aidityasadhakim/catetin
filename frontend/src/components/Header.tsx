import { BookOpen, Image, PenLine } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-cream/90 border-b border-gold/20">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          to="/"
          className="font-heading text-lg sm:text-xl tracking-widest text-charcoal hover:text-navy transition-colors"
        >
          CATETIN
        </Link>

        {/* Center Navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/refleksi"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-slate hover:text-charcoal transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-charcoal border-b-2 border-gold pb-1 px-2',
            }}
          >
            <BookOpen size={14} className="sm:w-4 sm:h-4" />
            <span>Riwayat</span>
          </Link>

          <button
            disabled
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-slate/50 cursor-not-allowed px-2 py-1"
            title="Coming Soon"
          >
            <Image size={14} className="sm:w-4 sm:h-4" />
            <span>Galeri</span>
          </button>

          {/* Mobile quick-write button */}
          <Link
            to="/refleksi"
            className="sm:hidden flex items-center justify-center w-8 h-8 bg-navy rounded-full text-cream"
          >
            <PenLine size={14} />
          </Link>
        </div>

        {/* User Button - Right */}
        <div>
          <ClerkHeader />
        </div>
      </nav>
    </header>
  )
}
