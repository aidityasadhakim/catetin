# App Flow Refactor Implementation Plan

**Goal:** Refactor app flow to single-screen welcome with Three.js curtain animation transition to chat page, replace sidebar with horizontal navbar.

**Architecture:** The app will have a new welcome page (`/`) with Three.js curtain scene that parts to reveal the chat page (`/refleksi`). The sidebar navigation is replaced with a sticky horizontal navbar. Mobile devices get simplified animations with Three.js disabled.

**Epic Issues:**
- catetin-y32: Create Navbar Component
- catetin-ef1: Setup Three.js Infrastructure
- catetin-o8i: Redesign Chat Page Background
- catetin-2wa: Create Welcome Page with Curtain Scene
- catetin-cva: Create Ambient Three.js Scene for Chat
- catetin-rjn: Update Chat Interface Styling
- catetin-5ux: Mobile Optimizations
- catetin-izg: Cleanup Unused Components

---

## Layer 1: Foundation (Parallel Tasks)

---

## Task 1: Create Navbar Component (catetin-y32)

**Files:**
- Modify: `frontend/src/components/Header.tsx` (replace entirely)
- Create: `frontend/src/hooks/useIsMobile.ts`

### Step 1.1: Create mobile detection hook

Create file `frontend/src/hooks/useIsMobile.ts`:

```typescript
import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
```

### Step 1.2: Verify hook compiles

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 1.3: Export hook from index

Modify `frontend/src/hooks/index.ts` - add at the top:

```typescript
export { useIsMobile } from './useIsMobile'
```

### Step 1.4: Replace Header.tsx with Navbar

Replace entire content of `frontend/src/components/Header.tsx`:

```typescript
import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import { BookOpen, Image } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-cream/90 border-b border-gold/20">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          to="/"
          className="font-heading text-xl tracking-widest text-charcoal hover:text-navy transition-colors"
        >
          CATETIN
        </Link>

        {/* Center Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/refleksi"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate hover:text-charcoal transition-colors"
            activeProps={{
              className:
                'flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-charcoal border-b-2 border-gold pb-1',
            }}
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>

          <button
            disabled
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate/50 cursor-not-allowed"
            title="Coming Soon"
          >
            <Image size={16} />
            <span className="hidden sm:inline">Galeri</span>
          </button>
        </div>

        {/* User Button - Right */}
        <div>
          <ClerkHeader />
        </div>
      </nav>
    </header>
  )
}
```

### Step 1.5: Verify navbar renders

Run: `cd frontend && npm run dev`
Expected: Navigate to http://localhost:3000 - see horizontal navbar with:
- "CATETIN" logo on left
- "Riwayat" and "Galeri" in center
- User button on right

### Step 1.6: Commit Layer 1 - Navbar

```bash
git add frontend/src/components/Header.tsx frontend/src/hooks/useIsMobile.ts frontend/src/hooks/index.ts
git commit -m "feat(navbar): replace sidebar with horizontal navbar

- Remove hamburger menu and slide-out sidebar
- Add sticky semi-transparent navbar with backdrop blur
- Center navigation: Riwayat (active), Galeri (disabled)
- Add useIsMobile hook for future mobile optimizations

Issue: catetin-y32"
```

---

## Task 2: Setup Three.js Infrastructure (catetin-ef1)

**Files:**
- Create: `frontend/src/lib/three/webgl-detector.ts`
- Create: `frontend/src/lib/three/scene-manager.ts`

### Step 2.1: Install Three.js dependencies

Run: `cd frontend && npm install three && npm install -D @types/three`
Expected: Package added to dependencies

### Step 2.2: Create WebGL detector

Create file `frontend/src/lib/three/webgl-detector.ts`:

```typescript
/**
 * Detects WebGL support in the browser
 * Returns an object with support flags and fallback message
 */
export interface WebGLSupport {
  webgl: boolean
  webgl2: boolean
  message: string | null
}

export function detectWebGL(): WebGLSupport {
  const result: WebGLSupport = {
    webgl: false,
    webgl2: false,
    message: null,
  }

  try {
    const canvas = document.createElement('canvas')

    // Check WebGL2 first
    const gl2 = canvas.getContext('webgl2')
    if (gl2) {
      result.webgl2 = true
      result.webgl = true
      return result
    }

    // Fallback to WebGL1
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    if (gl) {
      result.webgl = true
      return result
    }

    result.message =
      'WebGL is not supported. Please use a modern browser.'
  } catch (e) {
    result.message =
      'WebGL detection failed. Your browser may not support 3D graphics.'
  }

  return result
}

/**
 * Simple hook-friendly check
 */
export function isWebGLAvailable(): boolean {
  const { webgl } = detectWebGL()
  return webgl
}
```

### Step 2.3: Create scene manager

Create file `frontend/src/lib/three/scene-manager.ts`:

```typescript
import * as THREE from 'three'

export interface SceneManagerConfig {
  container: HTMLElement
  antialias?: boolean
  alpha?: boolean
  pixelRatio?: number
}

export interface SceneManagerAPI {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  start: () => void
  stop: () => void
  dispose: () => void
  onResize: () => void
  addUpdateCallback: (callback: (delta: number) => void) => void
}

/**
 * Creates and manages a Three.js scene with animation loop
 */
export function createSceneManager(
  config: SceneManagerConfig
): SceneManagerAPI {
  const { container, antialias = true, alpha = true, pixelRatio } = config

  // Scene
  const scene = new THREE.Scene()

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias,
    alpha,
  })
  renderer.setPixelRatio(pixelRatio ?? Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // Animation state
  let animationId: number | null = null
  let lastTime = 0
  const updateCallbacks: ((delta: number) => void)[] = []

  // Animation loop
  function animate(time: number) {
    animationId = requestAnimationFrame(animate)

    const delta = (time - lastTime) / 1000
    lastTime = time

    // Run all update callbacks
    updateCallbacks.forEach((cb) => cb(delta))

    renderer.render(scene, camera)
  }

  // Handle resize
  function onResize() {
    const width = container.clientWidth
    const height = container.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // Cleanup
  function dispose() {
    stop()
    renderer.dispose()
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement)
    }
    // Dispose all scene objects
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  }

  function start() {
    if (animationId === null) {
      lastTime = performance.now()
      animationId = requestAnimationFrame(animate)
    }
  }

  function stop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  function addUpdateCallback(callback: (delta: number) => void) {
    updateCallbacks.push(callback)
  }

  return {
    scene,
    camera,
    renderer,
    start,
    stop,
    dispose,
    onResize,
    addUpdateCallback,
  }
}
```

### Step 2.4: Verify Three.js types

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 2.5: Commit Layer 1 - Three.js Infrastructure

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/three/
git commit -m "feat(three): setup Three.js infrastructure

- Add three and @types/three dependencies
- Create webgl-detector.ts for WebGL support detection
- Create scene-manager.ts with reusable scene/camera/renderer setup
- Include animation loop management and cleanup utilities

Issue: catetin-ef1"
```

---

## Task 3: Redesign Chat Page Background (catetin-o8i)

**Files:**
- Create: `frontend/src/components/ChatBackground.tsx`

### Step 3.1: Create ChatBackground component

Create file `frontend/src/components/ChatBackground.tsx`:

```typescript
/**
 * Static decorative background for the chat/refleksi page
 * Sky gradient from cream to soft blue with Renaissance-style decorations
 */
export default function ChatBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #F5F0E8 0%, #E8F4F8 50%, #D4E5ED 100%)',
        }}
      />

      {/* Decorative angel - top right */}
      <img
        src="/assets/images/single-baby-angel.png"
        alt=""
        aria-hidden="true"
        className="absolute top-16 right-8 w-24 h-auto opacity-30 animate-float-gentle"
        style={{ animationDelay: '0s' }}
      />

      {/* Decorative angel - top left */}
      <img
        src="/assets/images/three-baby-angel.png"
        alt=""
        aria-hidden="true"
        className="absolute top-32 left-4 w-32 h-auto opacity-20 animate-float-gentle"
        style={{ animationDelay: '2s' }}
      />

      {/* Decorative branches - bottom left */}
      <img
        src="/assets/images/single-bush.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-48 h-auto opacity-20"
      />

      {/* Subtle clouds using CSS */}
      <div
        className="absolute top-1/4 left-1/3 w-64 h-24 rounded-full opacity-10"
        style={{
          background:
            'radial-gradient(ellipse, white 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-48 h-16 rounded-full opacity-10"
        style={{
          background:
            'radial-gradient(ellipse, white 0%, transparent 70%)',
        }}
      />

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(245,240,232,0.5) 100%)',
        }}
      />
    </div>
  )
}
```

### Step 3.2: Verify component compiles

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 3.3: Commit Layer 1 - Chat Background

```bash
git add frontend/src/components/ChatBackground.tsx
git commit -m "feat(chat): create decorative chat page background

- Sky gradient from cream to soft blue
- Static Renaissance decorations (angels, branches)
- Subtle CSS clouds and vignette overlay
- Float animation on angels with staggered delays

Issue: catetin-o8i"
```

---

## Layer 2: Core Features

---

## Task 4: Create Welcome Page with Curtain Scene (catetin-2wa)

**Files:**
- Create: `frontend/src/lib/three/curtain-scene.ts`
- Modify: `frontend/src/routes/index.tsx` (replace entirely)

### Step 4.1: Create curtain scene module

Create file `frontend/src/lib/three/curtain-scene.ts`:

```typescript
import * as THREE from 'three'
import type { SceneManagerAPI } from './scene-manager'

export interface CurtainSceneAPI {
  open: () => Promise<void>
  reset: () => void
}

/**
 * Creates theater curtain geometry and animation
 * Two fabric panels that part from center when triggered
 */
export function createCurtainScene(
  manager: SceneManagerAPI
): CurtainSceneAPI {
  const { scene, camera } = manager

  // Position camera for curtain view
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Curtain material - deep velvet burgundy
  const curtainMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b2d3a, // burgundy from design system
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  })

  // Create curtain panels (simple planes for now)
  const curtainWidth = 4
  const curtainHeight = 6
  const curtainGeometry = new THREE.PlaneGeometry(
    curtainWidth,
    curtainHeight,
    32,
    32
  )

  // Left curtain
  const leftCurtain = new THREE.Mesh(curtainGeometry, curtainMaterial)
  leftCurtain.position.set(-curtainWidth / 2, 0, 0)
  scene.add(leftCurtain)

  // Right curtain
  const rightCurtain = new THREE.Mesh(
    curtainGeometry.clone(),
    curtainMaterial.clone()
  )
  rightCurtain.position.set(curtainWidth / 2, 0, 0)
  scene.add(rightCurtain)

  // Gold trim line at top
  const trimGeometry = new THREE.PlaneGeometry(curtainWidth * 2.2, 0.3)
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a84b, // gold from design system
    roughness: 0.3,
    metalness: 0.7,
  })
  const trim = new THREE.Mesh(trimGeometry, trimMaterial)
  trim.position.set(0, curtainHeight / 2 + 0.15, 0.1)
  scene.add(trim)

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // Spotlight from above
  const spotLight = new THREE.SpotLight(0xffd700, 1.5)
  spotLight.position.set(0, 5, 5)
  spotLight.angle = Math.PI / 4
  scene.add(spotLight)

  // Animation state
  let isAnimating = false
  let animationProgress = 0
  const animationDuration = 1.5 // seconds

  // Update callback for animation
  manager.addUpdateCallback((delta) => {
    if (!isAnimating) return

    animationProgress += delta / animationDuration
    if (animationProgress >= 1) {
      animationProgress = 1
      isAnimating = false
    }

    // Ease out cubic
    const t = 1 - Math.pow(1 - animationProgress, 3)

    // Move curtains apart
    const openDistance = 4
    leftCurtain.position.x = -curtainWidth / 2 - openDistance * t
    rightCurtain.position.x = curtainWidth / 2 + openDistance * t

    // Slight rotation for depth
    leftCurtain.rotation.y = -0.3 * t
    rightCurtain.rotation.y = 0.3 * t
  })

  async function open(): Promise<void> {
    return new Promise((resolve) => {
      isAnimating = true
      animationProgress = 0

      // Resolve after animation completes
      setTimeout(() => {
        resolve()
      }, animationDuration * 1000 + 200)
    })
  }

  function reset() {
    isAnimating = false
    animationProgress = 0
    leftCurtain.position.x = -curtainWidth / 2
    rightCurtain.position.x = curtainWidth / 2
    leftCurtain.rotation.y = 0
    rightCurtain.rotation.y = 0
  }

  return { open, reset }
}
```

### Step 4.2: Replace index.tsx with Welcome Page

Replace entire content of `frontend/src/routes/index.tsx`:

```typescript
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !webglSupported) return

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
  }, [webglSupported])

  const handleStart = async () => {
    setIsLoading(true)

    if (curtainRef.current) {
      await curtainRef.current.open()
    }

    // Navigate to refleksi page
    navigate({ to: '/refleksi' })
  }

  // Fallback for no WebGL
  if (!webglSupported) {
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
```

### Step 4.3: Verify welcome page compiles

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 4.4: Test welcome page

Run: `cd frontend && npm run dev`
Expected: Navigate to http://localhost:3000:
- See curtain scene with burgundy panels
- See "CATETIN" title centered over curtains
- Click "Mulai Menulis" - curtains part, navigate to /refleksi

### Step 4.5: Commit Layer 2 - Welcome Page

```bash
git add frontend/src/lib/three/curtain-scene.ts frontend/src/routes/index.tsx
git commit -m "feat(welcome): create welcome page with Three.js curtain scene

- Full-viewport Three.js canvas with curtain animation
- Burgundy velvet curtains with gold trim
- 'CATETIN' title overlay with fade-in animation
- 'Mulai Menulis' button triggers curtain-parting animation
- WebGL fallback for unsupported browsers
- Navigate to /refleksi after animation

Issue: catetin-2wa"
```

---

## Task 5: Create Ambient Three.js Scene for Chat (catetin-cva)

**Files:**
- Create: `frontend/src/lib/three/particles-scene.ts`
- Create: `frontend/src/components/AmbientParticles.tsx`

### Step 5.1: Create particles scene module

Create file `frontend/src/lib/three/particles-scene.ts`:

```typescript
import * as THREE from 'three'
import type { SceneManagerAPI } from './scene-manager'

export interface ParticlesSceneAPI {
  setEnabled: (enabled: boolean) => void
}

/**
 * Creates subtle floating particles for ambient atmosphere
 * Designed to be unobtrusive and calming
 */
export function createParticlesScene(
  manager: SceneManagerAPI
): ParticlesSceneAPI {
  const { scene, camera } = manager

  // Position camera
  camera.position.set(0, 0, 20)
  camera.lookAt(0, 0, 0)

  // Particle count
  const particleCount = 50
  const particles: THREE.Mesh[] = []

  // Particle material - soft gold with transparency
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4a84b,
    transparent: true,
    opacity: 0.3,
  })

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    const size = 0.05 + Math.random() * 0.1
    const geometry = new THREE.CircleGeometry(size, 8)
    const particle = new THREE.Mesh(geometry, particleMaterial.clone())

    // Random position
    particle.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 10
    )

    // Store velocity in userData
    particle.userData = {
      velocityY: 0.1 + Math.random() * 0.2,
      velocityX: (Math.random() - 0.5) * 0.1,
      initialX: particle.position.x,
      phase: Math.random() * Math.PI * 2,
    }

    scene.add(particle)
    particles.push(particle)
  }

  // Animation enabled flag
  let enabled = true

  // Update callback
  manager.addUpdateCallback((delta) => {
    if (!enabled) return

    particles.forEach((p) => {
      const data = p.userData as {
        velocityY: number
        velocityX: number
        initialX: number
        phase: number
      }

      // Float upward
      p.position.y += data.velocityY * delta

      // Gentle horizontal drift
      data.phase += delta * 0.5
      p.position.x = data.initialX + Math.sin(data.phase) * 0.5

      // Reset when off screen
      if (p.position.y > 20) {
        p.position.y = -20
        p.position.x = data.initialX
      }
    })
  })

  function setEnabled(value: boolean) {
    enabled = value
    particles.forEach((p) => {
      p.visible = value
    })
  }

  return { setEnabled }
}
```

### Step 5.2: Create AmbientParticles component

Create file `frontend/src/components/AmbientParticles.tsx`:

```typescript
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
```

### Step 5.3: Verify particles component compiles

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 5.4: Commit Layer 2 - Ambient Particles

```bash
git add frontend/src/lib/three/particles-scene.ts frontend/src/components/AmbientParticles.tsx
git commit -m "feat(chat): create ambient Three.js particle scene

- Subtle floating gold particles for atmosphere
- Particles drift upward with gentle horizontal sway
- Performance optimized (low particle count, no antialiasing)
- Automatically disabled on mobile devices
- Transparent overlay that doesn't block interaction

Issue: catetin-cva"
```

---

## Task 6: Update Chat Interface Styling (catetin-rjn)

**Files:**
- Modify: `frontend/src/routes/refleksi.tsx`

### Step 6.1: Update refleksi.tsx with new styling

Apply these changes to `frontend/src/routes/refleksi.tsx`:

**Change 1:** Add imports at top (line 4):

Replace:
```typescript
import { Send, Loader2, Sparkles, PenLine } from 'lucide-react'
```

With:
```typescript
import { Send, Loader2, Sparkles, PenLine, Feather } from 'lucide-react'
import ChatBackground from '../components/ChatBackground'
import AmbientParticles from '../components/AmbientParticles'
```

**Change 2:** Modify JournalInterface return for active session (starts around line 240):

Replace the active chat session section starting at `// Active chat session`:

```typescript
  // Active chat session
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background layers */}
      <ChatBackground />
      <AmbientParticles />

      {/* Header with title and turn indicator */}
      <div className="sticky top-14 z-10 bg-cream/80 backdrop-blur-sm border-b border-gold/20 px-4 py-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-heading text-2xl text-charcoal tracking-widest mb-2">
            REFLEKSI
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-slate">
              Giliran
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((turn) => (
                <div
                  key={turn}
                  className={`w-8 h-2 rounded-full transition-all ${
                    turn <= turnNumber
                      ? 'bg-gold'
                      : 'bg-parchment border border-gold/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoadingSession && localMessages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={32} />
            </div>
          ) : (
            localMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0 shadow-md">
                <Feather size={16} className="text-gold" />
              </div>
              <div className="bg-ivory/90 backdrop-blur-sm border border-gold/20 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - bottom anchored */}
      <div className="sticky bottom-0 bg-cream/90 backdrop-blur-sm border-t border-gold/20 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-ivory/90 border border-gold/30 rounded-xl p-2 shadow-sm">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ceritakan apa yang ada di pikiranmu..."
              disabled={isSending || isComplete}
              rows={1}
              className="flex-1 resize-none bg-transparent font-body text-charcoal placeholder-slate/50 px-3 py-2 focus:outline-none disabled:opacity-50"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || isComplete}
              className="p-3 bg-navy text-cream rounded-lg hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate/60 mt-2 text-center">
            Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  )
```

**Change 3:** Update ChatMessage component (around line 343):

Replace the entire ChatMessage component:

```typescript
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
          isUser ? 'bg-gold' : 'bg-navy'
        }`}
      >
        {isUser ? (
          <span className="font-mono text-sm text-navy font-bold">A</span>
        ) : (
          <Feather size={16} className="text-gold" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-gold text-navy rounded-tr-none'
            : 'bg-ivory/90 backdrop-blur-sm border border-gold/20 text-charcoal rounded-tl-none'
        }`}
      >
        <p className="font-body leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  )
}
```

### Step 6.2: Verify refleksi page compiles

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 6.3: Test chat interface

Run: `cd frontend && npm run dev`
Expected: Navigate to http://localhost:3000/refleksi (signed in):
- See sky gradient background with decorations
- See floating particles on desktop
- See "REFLEKSI" title centered with turn indicator below
- See AI avatar (Feather icon) in navy circle
- See input anchored at bottom

### Step 6.4: Commit Layer 2 - Chat Interface Styling

```bash
git add frontend/src/routes/refleksi.tsx
git commit -m "feat(chat): update chat interface styling

- Add ChatBackground and AmbientParticles components
- Center 'REFLEKSI' title with turn indicator below
- Update AI avatar with Feather icon (Sang Pujangga)
- Add backdrop blur and shadows to message bubbles
- Bottom-anchored input with improved styling
- Sticky header accounts for navbar height (top-14)

Issue: catetin-rjn"
```

---

## Layer 3: Polish and Cleanup

---

## Task 7: Mobile Optimizations (catetin-5ux)

**Files:**
- Modify: `frontend/src/components/Header.tsx` (responsive updates)
- Modify: `frontend/src/routes/index.tsx` (mobile fallback)
- Modify: `frontend/src/styles.css` (add responsive utilities)

### Step 7.1: Add responsive animation utilities to styles.css

Add before the closing `}` of `@theme inline` block in `frontend/src/styles.css`:

```css
  /* Reduced motion media query */
  @media (prefers-reduced-motion: reduce) {
    --animate-fade-in: none;
    --animate-fade-in-up: none;
    --animate-golden-reveal: none;
    --animate-float-gentle: none;
  }
```

### Step 7.2: Update Header.tsx for mobile

Modify `frontend/src/components/Header.tsx` to improve mobile nav:

Replace entire content:

```typescript
import { Link } from '@tanstack/react-router'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import { BookOpen, Image, PenLine } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-cream/90 border-b border-gold/20">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          to="/"
          className="font-heading text-lg sm:text-xl tracking-widest text-charcoal hover:text-navy transition-colors"
        >
          CATETIN
        </Link>

        {/* Center Navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/refleksi"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-slate hover:text-charcoal transition-colors px-2 py-1"
            activeProps={{
              className:
                'flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-charcoal border-b-2 border-gold pb-1 px-2',
            }}
          >
            <BookOpen size={14} className="sm:w-4 sm:h-4" />
            <span>Riwayat</span>
          </Link>

          <button
            disabled
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-slate/50 cursor-not-allowed px-2 py-1"
            title="Coming Soon"
          >
            <Image size={14} className="sm:w-4 sm:h-4" />
            <span>Galeri</span>
          </button>

          {/* Mobile quick-write button */}
          <Link
            to="/refleksi"
            className="sm:hidden flex items-center justify-center w-8 h-8 bg-navy rounded-full text-cream"
          >
            <PenLine size={14} />
          </Link>
        </div>

        {/* User Button - Right */}
        <div>
          <ClerkHeader />
        </div>
      </nav>
    </header>
  )
}
```

### Step 7.3: Update welcome page for mobile

Modify `frontend/src/routes/index.tsx` - update the WelcomeScene component:

Add after the webglSupported state initialization:

```typescript
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
```

Add import at top:
```typescript
// No additional import needed - using inline check
```

Update the useEffect to skip Three.js on mobile:

Replace:
```typescript
  useEffect(() => {
    if (!containerRef.current || !webglSupported) return
```

With:
```typescript
  useEffect(() => {
    if (!containerRef.current || !webglSupported || isMobile) return
```

Update the fallback check:

Replace:
```typescript
  if (!webglSupported) {
```

With:
```typescript
  if (!webglSupported || isMobile) {
```

### Step 7.4: Verify mobile optimizations compile

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step 7.5: Test mobile view

Run: `cd frontend && npm run dev`
Expected: 
- Open browser dev tools, toggle mobile view
- Welcome page shows static fallback (no Three.js)
- Navbar items are smaller on mobile
- Chat page has no particles on mobile

### Step 7.6: Commit Layer 3 - Mobile Optimizations

```bash
git add frontend/src/components/Header.tsx frontend/src/routes/index.tsx frontend/src/styles.css
git commit -m "feat(mobile): add mobile optimizations

- Disable Three.js curtain scene on mobile (< 768px)
- Add responsive navbar sizing (smaller on mobile)
- Add quick-write FAB button on mobile navbar
- Add prefers-reduced-motion support
- Smaller text and icon sizes on mobile

Issue: catetin-5ux"
```

---

## Task 8: Cleanup Unused Components (catetin-izg)

**Files:**
- Delete: `frontend/src/components/Hero.tsx`
- Delete: `frontend/src/components/Narrative.tsx`
- Delete: `frontend/src/components/Features.tsx`
- Delete: `frontend/src/components/Footer.tsx`

### Step 8.1: Delete unused components

Run:
```bash
cd frontend && rm -f src/components/Hero.tsx src/components/Narrative.tsx src/components/Features.tsx src/components/Footer.tsx
```

Expected: Files deleted successfully

### Step 8.2: Verify no broken imports

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors (these components are no longer imported anywhere)

### Step 8.3: Verify app still runs

Run: `cd frontend && npm run dev`
Expected: App runs without errors

### Step 8.4: Commit Layer 3 - Cleanup

```bash
git add -A frontend/src/components/
git commit -m "chore(cleanup): remove unused landing page components

- Delete Hero.tsx (replaced by welcome page)
- Delete Narrative.tsx (no longer needed)
- Delete Features.tsx (no longer needed)
- Delete Footer.tsx (no longer needed)

Issue: catetin-izg"
```

---

## Final Verification

### Step F.1: Run full type check

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

### Step F.2: Run linter

Run: `cd frontend && npm run lint`
Expected: No errors (or only pre-existing warnings)

### Step F.3: Test full flow

Run: `cd frontend && npm run dev`

Test sequence:
1. Navigate to http://localhost:3000
2. See welcome page with curtain scene (or static fallback on mobile)
3. Click "Mulai Menulis"
4. Curtains part, navigate to /refleksi
5. See chat interface with sky background
6. See floating particles (desktop only)
7. Start a session and send messages
8. Verify navbar is visible throughout

### Step F.4: Final commit if any fixes needed

If any fixes were made during verification:
```bash
git add .
git commit -m "fix: address issues found during final verification"
```

---

## Summary

| Issue | Task | Status |
|-------|------|--------|
| catetin-y32 | Create Navbar Component | Layer 1 |
| catetin-ef1 | Setup Three.js Infrastructure | Layer 1 |
| catetin-o8i | Redesign Chat Page Background | Layer 1 |
| catetin-2wa | Create Welcome Page with Curtain Scene | Layer 2 |
| catetin-cva | Create Ambient Three.js Scene for Chat | Layer 2 |
| catetin-rjn | Update Chat Interface Styling | Layer 2 |
| catetin-5ux | Mobile Optimizations | Layer 3 |
| catetin-izg | Cleanup Unused Components | Layer 3 |

**Total Files Created:** 8
- `frontend/src/hooks/useIsMobile.ts`
- `frontend/src/lib/three/webgl-detector.ts`
- `frontend/src/lib/three/scene-manager.ts`
- `frontend/src/lib/three/curtain-scene.ts`
- `frontend/src/lib/three/particles-scene.ts`
- `frontend/src/components/ChatBackground.tsx`
- `frontend/src/components/AmbientParticles.tsx`

**Total Files Modified:** 4
- `frontend/src/components/Header.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routes/refleksi.tsx`
- `frontend/src/styles.css`

**Total Files Deleted:** 4
- `frontend/src/components/Hero.tsx`
- `frontend/src/components/Narrative.tsx`
- `frontend/src/components/Features.tsx`
- `frontend/src/components/Footer.tsx`
