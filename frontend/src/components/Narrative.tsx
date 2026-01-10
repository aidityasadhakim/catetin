import { useRef, useEffect } from 'react';
import { Card } from './ui/Card';

export default function Narrative() {
  const narrativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = narrativeRef.current?.querySelectorAll('.narrative-step');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={narrativeRef} className="py-24 bg-ivory text-black">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-20">
           <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-widest mb-4">The Process</h2>
           <div className="w-24 h-1 bg-gold mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-black/10 -z-10" />

          {/* Step 1: Refleksi */}
          <div className="narrative-step opacity-0 transition-all duration-700">
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-cream border-2 border-black flex items-center justify-center mb-6 relative p-6">
                   <img src="/assets/icons/quill-ink.svg" alt="Refleksi" className="w-full h-full object-contain opacity-80" />
                   <div className="absolute top-0 right-0 w-2 h-2 bg-gold" />
                </div>
                <h3 className="font-heading text-xl mb-4">Refleksi</h3>
                <Card variant="parchment" className="text-sm p-6 w-full min-h-[160px] flex items-center justify-center bg-[url('/assets/images/journal-detail.jpg')] bg-cover bg-center bg-blend-overlay bg-white/90">
                  "Writing is the painting of the voice."
                </Card>
                <p className="mt-6 font-body text-slate">
                  Pour your thoughts into words. Our AI companion, Sang Pujangga, guides you through deep introspection.
                </p>
             </div>
          </div>

          {/* Step 2: Persembahan */}
          <div className="narrative-step opacity-0 transition-all duration-700 delay-200">
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-cream border-2 border-black flex items-center justify-center mb-6 relative p-6">
                   <img src="/assets/icons/book-open.svg" alt="Persembahan" className="w-full h-full object-contain opacity-80" />
                   <div className="absolute top-0 right-0 w-2 h-2 bg-coral" />
                </div>
                <h3 className="font-heading text-xl mb-4">Persembahan</h3>
                <Card variant="technical" className="text-sm p-4 w-full min-h-[160px] flex flex-col justify-center items-center gap-2">
                   <div className="font-mono text-xs text-graphite self-start">DATA_INPUT</div>
                   <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gold w-[75%]" />
                   </div>
                   <div className="font-mono text-xs self-end">75% COMPLETE</div>
                </Card>
                <p className="mt-6 font-body text-slate">
                  Your words become an offering. Earn 'Tinta Emas' based on the depth of your reflection.
                </p>
             </div>
          </div>

          {/* Step 3: Mahakarya */}
          <div className="narrative-step opacity-0 transition-all duration-700 delay-400">
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-cream border-2 border-black flex items-center justify-center mb-6 relative p-6">
                   <img src="/assets/icons/palette.svg" alt="Mahakarya" className="w-full h-full object-contain opacity-80" />
                   <div className="absolute top-0 right-0 w-2 h-2 bg-navy" />
                </div>
                <h3 className="font-heading text-xl mb-4">Mahakarya</h3>
                <Card variant="default" className="p-2 w-full min-h-[160px] bg-navy text-ivory flex items-center justify-center overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('/assets/images/art-gallery.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity hover:opacity-100 transition-opacity duration-700" />
                   <div className="relative z-10 font-heading text-2xl text-gold drop-shadow-lg">Reveal</div>
                </Card>
                <p className="mt-6 font-body text-slate">
                  Unlock classical masterpieces. Build your personal gallery of wisdom and art.
                </p>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
