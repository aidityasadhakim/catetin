import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import { useState } from 'react'
import { Home, Menu, X, BookOpen, Image, Settings } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-cream text-black shadow-sm border-b-2 border-double border-charcoal">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-parchment rounded-lg transition-colors mr-4"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-black" />
          </button>
          <h1 className="text-2xl font-heading font-bold text-black tracking-widest">
            <Link to="/">
              CATETIN
            </Link>
          </h1>
        </div>
        <div>
          <ClerkHeader />
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-ivory text-black shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-charcoal ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-charcoal bg-cream">
          <h2 className="text-xl font-heading font-bold">NAVIGASI</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-parchment rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto bg-ivory">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-parchment transition-colors mb-2 font-mono text-sm tracking-widest uppercase"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-parchment transition-colors mb-2 font-mono text-sm tracking-widest uppercase border border-charcoal',
            }}
          >
            <Home size={18} />
            <span>Beranda</span>
          </Link>
          
          <div className="my-4 border-t border-dashed border-gray-400"></div>
          
          <Link
            to="/refleksi"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-parchment transition-colors mb-2 font-mono text-sm tracking-widest uppercase"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-parchment transition-colors mb-2 font-mono text-sm tracking-widest uppercase border border-charcoal',
            }}
          >
            <BookOpen size={18} />
            <span>Refleksi</span>
          </Link>

          <div className="px-3 py-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
            Coming Soon
          </div>

          <button
             disabled
            className="flex w-full items-center gap-3 p-3 rounded-lg text-gray-400 cursor-not-allowed mb-2 font-mono text-sm tracking-widest uppercase"
          >
            <Image size={18} />
            <span>Galeri</span>
          </button>
          
          <button
             disabled
            className="flex w-full items-center gap-3 p-3 rounded-lg text-gray-400 cursor-not-allowed mb-2 font-mono text-sm tracking-widest uppercase"
          >
            <Settings size={18} />
            <span>Pengaturan</span>
          </button>

        </nav>

        <div className="p-4 border-t border-charcoal bg-cream flex flex-col gap-2">
           <div className="text-xs font-mono text-center text-gray-600">
            v1.1.0 • CATETIN SYSTEM
           </div>
        </div>
      </aside>
      
      {/* Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
