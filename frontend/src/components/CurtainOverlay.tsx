import { forwardRef, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'

export interface CurtainOverlayRef {
  open: () => Promise<void>
}

/**
 * Theater curtain overlay component with GSAP animation
 * Two fabric panels that part from center when triggered
 */
const CurtainOverlay = forwardRef<CurtainOverlayRef>((_props, ref) => {
  const leftCurtainRef = useRef<HTMLDivElement>(null)
  const rightCurtainRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    open: async () => {
      return new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: resolve,
        })

        // Curtains part to sides with slight rotation
        tl.to(
          leftCurtainRef.current,
          {
            x: '-100%',
            rotateY: -15,
            duration: 1.2,
            ease: 'power3.inOut',
          },
          0,
        )
          .to(
            rightCurtainRef.current,
            {
              x: '100%',
              rotateY: 15,
              duration: 1.2,
              ease: 'power3.inOut',
            },
            0,
          )
          // Fade out container
          .to(
            containerRef.current,
            {
              opacity: 0,
              duration: 0.3,
            },
            1,
          )
      })
    },
  }))

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 pointer-events-none overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      {/* Left curtain */}
      <div
        ref={leftCurtainRef}
        className="absolute top-0 left-0 w-1/2 h-full origin-left"
        style={{
          background:
            'linear-gradient(to right, #5A2633 0%, #6B2D3A 50%, #7A3545 100%)',
          boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Fold lines for fabric effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-black/30"
              style={{ left: `${20 + i * 15}%` }}
            />
          ))}
        </div>
      </div>

      {/* Right curtain */}
      <div
        ref={rightCurtainRef}
        className="absolute top-0 right-0 w-1/2 h-full origin-right"
        style={{
          background:
            'linear-gradient(to left, #5A2633 0%, #6B2D3A 50%, #7A3545 100%)',
          boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.3)',
        }}
      >
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-black/30"
              style={{ right: `${20 + i * 15}%` }}
            />
          ))}
        </div>
      </div>

      {/* Gold trim at top */}
      <div
        className="absolute top-0 left-0 right-0 h-8 z-10"
        style={{
          background: 'linear-gradient(to bottom, #D4A84B 0%, #B8923F 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
})

CurtainOverlay.displayName = 'CurtainOverlay'
export default CurtainOverlay
