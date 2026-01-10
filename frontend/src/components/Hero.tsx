import { Button } from './ui/Button';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-cream px-4 py-20">
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/images/hero-writing.jpg" 
          alt="Renaissance writing" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream" />
      </div>
      
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)]" />
      
      {/* Renaissance Ornaments */}
      <img src="/renaissance-ornament.svg" alt="" className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-20 transform -scale-x-100 pointer-events-none" />
      <img src="/renaissance-ornament.svg" alt="" className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20 pointer-events-none" />
      <img src="/renaissance-ornament.svg" alt="" className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-20 transform -scale-x-100 -scale-y-100 pointer-events-none" />
      <img src="/renaissance-ornament.svg" alt="" className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20 transform -scale-y-100 pointer-events-none" />

      <div className="z-10 text-center max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Hook / Label */}
        <div className="inline-block border border-black px-3 py-1 bg-ivory mb-4">
           <span className="font-mono text-xs tracking-[0.2em] uppercase text-graphite">
             System v1.1.0 • Ready for Injection
           </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] text-black tracking-tight">
          Transform Journaling <br />
          <span className="italic font-serif text-gold-dark">into a Masterpiece</span>
        </h1>

        {/* Value Proposition */}
        <p className="font-body text-lg md:text-xl text-slate max-w-2xl mx-auto leading-relaxed">
          Catetin combines Renaissance aesthetics with brutalist functionality. 
          Reflect with an AI companion and reveal classical artwork as you write.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button variant="brutalist" size="lg" className="w-full sm:w-auto">
            Mulai Menulis
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            Pelajari Lebih Lanjut
          </Button>
        </div>

        {/* Trust Signals / Metrics */}
        <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-black/10 w-full max-w-3xl mx-auto">
           <div className="text-center">
             <div className="font-display text-3xl md:text-4xl text-black">10k+</div>
             <div className="font-mono text-[10px] tracking-widest uppercase text-slate mt-1">Reflections</div>
           </div>
           <div className="text-center">
             <div className="font-display text-3xl md:text-4xl text-black">500+</div>
             <div className="font-mono text-[10px] tracking-widest uppercase text-slate mt-1">Artworks</div>
           </div>
           <div className="text-center">
             <div className="font-display text-3xl md:text-4xl text-black">98%</div>
             <div className="font-mono text-[10px] tracking-widest uppercase text-slate mt-1">Satisfaction</div>
           </div>
           <div className="text-center">
             <div className="font-display text-3xl md:text-4xl text-black">24/7</div>
             <div className="font-mono text-[10px] tracking-widest uppercase text-slate mt-1">AI Availability</div>
           </div>
        </div>
      </div>
    </section>
  );
}
