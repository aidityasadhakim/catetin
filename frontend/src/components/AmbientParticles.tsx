import { useEffect, useRef } from 'react'
import { isWebGLAvailable } from '../lib/three/webgl-detector'
import { createSceneManager } from '../lib/three/scene-manager'
import { createParticlesScene } from '../lib/three/particles-scene'
import { useIsMobile } from '../hooks'

/**
 * Ambient floating particles overlay for the chat page
 * Automatically disabled on mobile devices
 */
export default function AmbientParticles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const webglSupported = isWebGLAvailable()

  useEffect(() => {
    // Don't render on mobile or without WebGL
    if (!containerRef.current || isMobile || !webglSupported) return

    const manager = createSceneManager({
      container: containerRef.current,
      antialias: false, // Performance optimization
      alpha: true,
      pixelRatio: 1, // Lower resolution for subtle effect
    })

    createParticlesScene(manager)
    manager.start()

    // Handle resize
    const handleResize = () => manager.onResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      manager.dispose()
    }
  }, [isMobile, webglSupported])

  // Don't render on mobile
  if (isMobile || !webglSupported) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-5 pointer-events-none"
      aria-hidden="true"
    />
  )
}
