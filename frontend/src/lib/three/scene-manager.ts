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
  const updateCallbacks: Array<(delta: number) => void> = []

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
