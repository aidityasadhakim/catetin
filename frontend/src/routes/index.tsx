import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Menu } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-navy text-cream selection:bg-gold selection:text-navy">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542259685-9a844439c0aa?q=80&w=2069&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-navy/40 mix-blend-multiply" />
      </div>

      {/* Decorative Borders/Lines */}
      <div className="absolute inset-x-8 top-24 bottom-24 border-x border-gold/20 z-10 pointer-events-none hidden md:block">
        <div className="absolute top-0 -left-1.5 w-3 h-3 bg-gold rotate-45" />
        <div className="absolute top-0 -right-1.5 w-3 h-3 bg-gold rotate-45" />
        <div className="absolute top-[20%] -left-1.5 w-2 h-2 border border-gold rotate-45" />
        <div className="absolute top-[20%] -right-1.5 w-2 h-2 border border-gold rotate-45" />
      </div>
      <div className="absolute inset-x-8 top-24 border-t border-gold/20 z-10 pointer-events-none hidden md:block" />

      {/* Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-8">
           {/* Logo */}
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gold/20 backdrop-blur-sm border border-gold/40 rotate-45 flex items-center justify-center">
                <div className="w-4 h-4 bg-gold rotate-45" />
             </div>
             <span className="font-heading text-2xl text-cream tracking-widest">CATETIN</span>
           </div>
           
           {/* Socials */}
           <div className="hidden md:flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-cream/60 ml-8">
             <span>Social</span>
             <a href="#" className="hover:text-gold transition-colors">Li</a>
             <a href="#" className="hover:text-gold transition-colors">In</a>
             <a href="#" className="hover:text-gold transition-colors">X</a>
           </div>
        </div>

        {/* Menu & CTA */}
        <div className="flex items-center gap-8">
           <div className="hidden md:flex items-center gap-8 font-body text-sm text-cream/80">
             <a href="/refleksi" className="hover:text-gold transition-colors">Reflections</a>
             <a href="#" className="hover:text-gold transition-colors">Gallery</a>
             <a href="#" className="hover:text-gold transition-colors">Manifesto</a>
           </div>
           
           <a href="/refleksi" className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-cream/20 bg-cream/5 backdrop-blur-sm hover:bg-cream/10 transition-colors text-sm font-medium">
             <span>Join the journey</span>
           </a>
           
           <button className="md:hidden text-cream">
             <Menu />
           </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-20 h-full flex flex-col justify-center px-8 md:px-24 pt-20">
        <div className="grid md:grid-cols-12 gap-12 items-center h-full">
          
          {/* Left/Center Text */}
          <div className="md:col-span-7 relative z-20">
            <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl leading-[0.9] text-cream mb-8">
              <span className="block italic font-light opacity-90">Craft Your</span>
              <span className="block text-gold ml-12">Masterpiece</span>
            </h1>
            
            <p className="font-body text-lg md:text-xl text-cream/80 max-w-lg leading-relaxed mb-10 ml-2">
              Transform fleeting thoughts into timeless art. A journaling experience designed for creators who see reflection as architecture — not just text.
            </p>
            
            <div className="flex items-center gap-6 ml-2">
              <a href="/refleksi" className="px-8 py-4 bg-gold text-navy font-heading font-bold text-lg rounded-full hover:bg-gold-light transition-transform hover:scale-105 shadow-[0_0_30px_rgba(212,168,75,0.3)]">
                Start Writing
              </a>
              <button className="px-8 py-4 text-cream font-heading text-lg hover:text-gold transition-colors flex items-center gap-2 group">
                View Gallery <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right/Center Imagery - Statue */}
          <div className="absolute md:relative md:col-span-5 inset-0 md:inset-auto z-10 flex justify-center md:justify-end items-center opacity-40 md:opacity-100 pointer-events-none md:pointer-events-auto">
             <div className="relative w-full h-[80vh] md:h-full flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1550186481-b552d8e068f8?q=80&w=1964&auto=format&fit=crop" 
                  alt="Classical Statue"
                  className="max-h-full object-contain drop-shadow-2xl grayscale contrast-125"
                />
             </div>
          </div>
          
        </div>
      </main>
      
      {/* Floating Card - "New Renaissance Collection" */}
      <div className="absolute bottom-32 right-12 z-30 hidden lg:block">
         <div className="relative group cursor-pointer">
            <div className="w-64 h-80 bg-navy/80 backdrop-blur-md border border-gold/20 p-2 transform rotate-3 transition-transform group-hover:rotate-0 duration-500">
               <div className="w-full h-full relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=2000&auto=format&fit=crop"
                    alt="Renaissance Art"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <span className="font-heading text-2xl text-gold italic">New<br/>Renaissance<br/>Collection</span>
                  </div>
               </div>
            </div>
            <div className="absolute -bottom-6 left-0 right-0 text-center">
               <span className="font-mono text-xs uppercase tracking-widest text-gold flex items-center justify-center gap-2">
                  View Collection <ArrowRight size={12} />
               </span>
            </div>
         </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between items-end z-30 text-xs font-mono uppercase tracking-widest text-cream/60">
        <div className="flex items-center gap-2">
           <div className="w-4 h-6 border border-cream/40 rounded-full flex justify-center pt-1">
              <div className="w-1 h-1 bg-gold rounded-full animate-bounce" />
           </div>
           <span>Scroll</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4 bg-navy/80 backdrop-blur border border-white/10 px-4 py-2 rounded-lg">
           <div className="w-8 h-5 rounded overflow-hidden">
             <img src="https://images.unsplash.com/photo-1580136608260-4eb11f4b64fe?q=80&w=100" className="w-full h-full object-cover" />
           </div>
           <span>Collection II</span>
           <div className="w-4 h-4 border-l border-white/20 ml-2" />
           <Menu size={14} />
        </div>
      </div>
    </div>
  )
}
