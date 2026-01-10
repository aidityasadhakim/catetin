import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { isWebGLAvailable } from '../lib/three/webgl-detector'
import { createSceneManager } from '../lib/three/scene-manager'
import { createCurtainScene } from '../lib/three/curtain-scene'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createSceneManager> | null>(null)
  const curtainRef = useRef<ReturnType<typeof createCurtainScene> | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [webglSupported] = useState(() => isWebGLAvailable())
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !webglSupported || isMobile) return

    const manager = createSceneManager({
      container: containerRef.current,
      antialias: true,
      alpha: true,
    })
    sceneRef.current = manager

    const curtain = createCurtainScene(manager)
    curtainRef.current = curtain

    manager.start()

    // Handle resize
    const handleResize = () => manager.onResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      manager.dispose()
    }
  }, [webglSupported, isMobile])

  const handleStart = async () => {
    setIsLoading(true)

    if (curtainRef.current) {
      await curtainRef.current.open()
    }

    // Navigate to refleksi page
    navigate({ to: '/refleksi' })
  }

  // Fallback for no WebGL or mobile
  if (!webglSupported || isMobile) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-5xl text-charcoal mb-6 tracking-wider">
            CATETIN
          </h1>
          <p className="font-body text-slate mb-8 leading-relaxed">
            Mulai perjalanan refleksimu hari ini.
          </p>
          <button
            onClick={() => navigate({ to: '/refleksi' })}
            className="inline-flex items-center gap-3 bg-navy text-cream font-mono uppercase tracking-widest px-8 py-4 rounded-lg hover:bg-charcoal transition-all transform hover:scale-105"
          >
            <span>Mulai Menulis</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #F5F0E8, #0F1729)' }}
      />

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="text-center">
          {/* Title */}
          <h1
            className="font-heading text-6xl md:text-8xl text-cream mb-8 tracking-[0.3em] animate-fade-in"
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            CATETIN
          </h1>

          {/* Subtitle */}
          <p
            className="font-body text-lg text-cream/80 mb-12 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            Persembahan untuk perjalanan jiwamu
          </p>

          {/* CTA Button */}
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
