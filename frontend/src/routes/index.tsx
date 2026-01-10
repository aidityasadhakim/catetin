import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import CurtainOverlay from '../components/CurtainOverlay'
import type {CurtainOverlayRef} from '../components/CurtainOverlay';

export const Route = createFileRoute('/')({
  component: WelcomePage,
})

function WelcomePage() {
  return (
    <>
      <SignedIn>
        <WelcomeScene />
      </SignedIn>
      <SignedOut>
        <WelcomeScene />
      </SignedOut>
    </>
  )
}

function WelcomeScene() {
  const navigate = useNavigate()
  const curtainRef = useRef<CurtainOverlayRef>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    setIsLoading(true)
    await curtainRef.current?.open()
    navigate({ to: '/refleksi' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, #F5F0E8, #0F1729)' }}
      />

      {/* Curtain overlay */}
      <CurtainOverlay ref={curtainRef} />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="text-center">
          <h1
            className="font-heading text-6xl md:text-8xl text-cream mb-8 tracking-[0.3em] animate-fade-in"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          >
            CATETIN
          </h1>

          <p
            className="font-body text-lg text-cream/80 mb-12 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            Persembahan untuk perjalanan jiwamu
          </p>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="inline-flex items-center gap-3 bg-gold text-navy font-mono uppercase tracking-widest px-10 py-5 rounded-lg hover:bg-gold-light transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed animate-fade-in shadow-lg"
            style={{ animationDelay: '0.6s' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Membuka...</span>
              </>
            ) : (
              <span>Mulai Menulis</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
