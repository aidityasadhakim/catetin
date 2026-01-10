import { Button } from './ui/Button';

export default function Features() {
  return (
    <section className="py-24 bg-parchment overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Text Content */}
        <div className="flex-1 space-y-8 z-10">
          <div className="inline-block border border-black px-2 py-1 bg-transparent">
             <span className="font-mono text-xs tracking-widest uppercase">Features v1.1</span>
          </div>
          
          <h2 className="font-display text-4xl lg:text-5xl leading-tight">
             Experience the <br/>
             <span className="italic text-coral">Art of Reflection</span>
          </h2>
          
          <div className="space-y-6 font-body text-lg text-charcoal">
             <p>
               <strong className="font-heading text-black block mb-2">Guided Sessions</strong>
               Engage in meaningful conversations with Sang Pujangga, your AI companion designed to deepen your introspection.
             </p>
             <p>
               <strong className="font-heading text-black block mb-2">Weekly Risalah</strong>
               Receive a beautifully crafted emotional summary of your week, analyzing patterns in your thoughts and feelings.
             </p>
             <p>
               <strong className="font-heading text-black block mb-2">Gamified Wisdom</strong>
               Track your streaks with 'Marmer' and unlock new artistic eras as you maintain your journaling habit.
             </p>
          </div>

          <Button variant="primary">Explore Features</Button>
        </div>

        {/* Visual Showcase (Abstract App Interface) */}
        <div className="flex-1 w-full relative">
           {/* Decorative Grid and Image */}
           <div className="absolute -inset-10 z-0">
              <img src="/assets/images/statues.jpg" alt="" className="w-full h-full object-cover opacity-10 mix-blend-multiply" />
           </div>
           <div className="absolute -inset-4 border-2 border-black/5 z-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1 }} />

           <div className="relative bg-cream border-2 border-black p-4 shadow-[8px_8px_0_#1A1A1A] max-w-md mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500 z-10">
              
              {/* Fake Browser Header */}
              <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-center">
                 <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-black" />
                    <div className="w-3 h-3 rounded-full border border-black" />
                    <div className="w-3 h-3 rounded-full border border-black" />
                 </div>
                 <div className="font-mono text-[10px] uppercase">catetin.app</div>
              </div>

              {/* Fake App Content */}
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-black/10 pb-4">
                    <div>
                       <div className="font-mono text-xs text-slate uppercase mb-1">Today's Prompt</div>
                       <div className="font-heading text-xl">What are you grateful for?</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark">
                       ✨
                    </div>
                 </div>

                 <div className="bg-ivory p-4 border border-dashed border-slate rounded min-h-[120px] font-accent text-sm italic text-slate/60">
                    Start typing your reflection here...
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <div className="font-mono text-xs text-slate">0 words</div>
                    <div className="px-3 py-1 bg-black text-white font-mono text-xs uppercase rounded">Save</div>
                 </div>
              </div>

              {/* Floating Element */}
              <div className="absolute -right-6 -bottom-6 bg-white border-2 border-black p-3 shadow-[4px_4px_0_#D4A84B] animate-float-gentle">
                 <div className="font-mono text-[10px] uppercase text-slate mb-1">Streak</div>
                 <div className="font-display text-3xl">12</div>
                 <div className="font-mono text-[10px] uppercase text-gold-dark">Days</div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
