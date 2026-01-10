import { createFileRoute } from '@tanstack/react-router'
import Hero from '../components/Hero'
import Narrative from '../components/Narrative'
import Features from '../components/Features'
import Footer from '../components/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="bg-cream min-h-screen">
      <Hero />
      <Narrative />
      <Features />
      {/* Social Proof is integrated into Hero/Features for now to keep it concise */}
      
      {/* Conversion Section - Simple Final CTA */}
      <section className="py-20 bg-navy text-ivory text-center">
         <div className="container mx-auto px-4">
            <h2 className="font-display text-4xl md:text-5xl mb-6">Ready to start your journey?</h2>
            <p className="font-body text-slate mb-8 max-w-xl mx-auto">
               Join thousands of others who have found clarity and peace through the art of reflection.
            </p>
            <button className="bg-gold text-navy font-mono uppercase tracking-widest px-8 py-4 rounded hover:bg-white hover:text-black transition-all transform hover:scale-105">
               Create Free Account
            </button>
         </div>
      </section>

      <Footer />
    </div>
  )
}
