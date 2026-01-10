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
