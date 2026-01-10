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
  const particles: Array<THREE.Mesh> = []

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
