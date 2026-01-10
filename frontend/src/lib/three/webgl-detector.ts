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
