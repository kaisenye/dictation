/**
 * AnimationUtils - Centralized animation system
 * Eliminates duplication from WindowManager animation methods
 */

class AnimationUtils {
  /**
   * Spring easing functions
   */
  static EASING = {
    // easeOutBack - for expansion animation
    OUT_BACK: (progress) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2)
    },
    
    // easeOutQuart - for shrinking animation  
    OUT_QUART: (progress) => {
      return 1 - Math.pow(1 - progress, 4)
    },
    
    // Linear - for testing
    LINEAR: (progress) => {
      return progress
    }
  }

  /**
   * Animate window size and position with spring easing
   * @param {BrowserWindow} window - Electron window to animate
   * @param {Object} from - Starting state {width, height, x, y}
   * @param {Object} to - Target state {width, height, x, y}
   * @param {Object} options - Animation options
   * @param {number} options.duration - Animation duration in ms
   * @param {number} options.steps - Number of animation steps
   * @param {Function} options.easing - Easing function
   * @returns {Promise<void>}
   */
  static async animateWindow(window, from, to, options = {}) {
    const {
      duration = 300,
      steps = 20,
      easing = AnimationUtils.EASING.OUT_BACK
    } = options

    if (!window) {
      console.warn('AnimationUtils: No window provided for animation')
      return
    }

    const stepDuration = duration / steps
    
    // Create animation promises array
    const animationPromises = []
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const easedProgress = Math.max(0, Math.min(1, easing(progress)))
      
      const currentState = {
        width: from.width + (to.width - from.width) * easedProgress,
        height: from.height + (to.height - from.height) * easedProgress,
        x: from.x + (to.x - from.x) * easedProgress,
        y: from.y + (to.y - from.y) * easedProgress
      }
      
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          if (window && !window.isDestroyed()) {
            window.setSize(Math.round(currentState.width), Math.round(currentState.height))
            window.setPosition(Math.round(currentState.x), Math.round(currentState.y))
          }
          resolve()
        }, i * stepDuration)
      })
      
      animationPromises.push(promise)
    }
    
    // Wait for all animation steps to complete
    await Promise.all(animationPromises)
  }

  /**
   * Calculate centered position for window expansion/shrinking
   * @param {Object} currentPos - Current position {x, y}
   * @param {Object} currentSize - Current size {width, height}
   * @param {Object} targetSize - Target size {width, height}
   * @returns {Object} - Centered position {x, y}
   */
  static getCenteredPosition(currentPos, currentSize, targetSize) {
    return {
      x: currentPos.x - (targetSize.width - currentSize.width) / 2,
      y: currentPos.y - (targetSize.height - currentSize.height) / 2
    }
  }

  /**
   * Create animation state objects for common window transitions
   */
  static createTransitionStates(basePosition, sizes) {
    return {
      from: {
        width: sizes.from.width,
        height: sizes.from.height,
        x: basePosition.x,
        y: basePosition.y
      },
      to: {
        width: sizes.to.width,
        height: sizes.to.height,
        x: basePosition.x - (sizes.to.width - sizes.from.width) / 2,
        y: basePosition.y - (sizes.to.height - sizes.from.height) / 2
      }
    }
  }

  /**
   * Animate window expansion with spring effect
   * @param {BrowserWindow} window - Window to animate
   * @param {Object} fromSize - Starting size {width, height}
   * @param {Object} toSize - Target size {width, height}
   * @param {Object} basePosition - Base position for centering
   * @param {Object} options - Animation options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async expandWindow(window, fromSize, toSize, basePosition, options = {}) {
    try {
      const states = AnimationUtils.createTransitionStates(basePosition, {
        from: fromSize,
        to: toSize
      })
      
      await AnimationUtils.animateWindow(window, states.from, states.to, {
        duration: options.duration || 300,
        steps: options.steps || 20,
        easing: AnimationUtils.EASING.OUT_BACK
      })
      
      console.log('Window expansion animation completed')
      return { success: true }
    } catch (error) {
      console.error('Failed to expand window:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Animate window shrinking with smooth effect
   * @param {BrowserWindow} window - Window to animate
   * @param {Object} fromBounds - Starting bounds {x, y, width, height}
   * @param {Object} toSize - Target size {width, height}
   * @param {Object} targetPosition - Target position {x, y}
   * @param {Object} options - Animation options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async shrinkWindow(window, fromBounds, toSize, targetPosition, options = {}) {
    try {
      const from = {
        width: fromBounds.width,
        height: fromBounds.height,
        x: fromBounds.x,
        y: fromBounds.y
      }
      
      const to = {
        width: toSize.width,
        height: toSize.height,
        x: targetPosition.x,
        y: targetPosition.y
      }
      
      await AnimationUtils.animateWindow(window, from, to, {
        duration: options.duration || 200,
        steps: options.steps || 12,
        easing: AnimationUtils.EASING.OUT_QUART
      })
      
      console.log('Window shrinking animation completed')
      return { success: true }
    } catch (error) {
      console.error('Failed to shrink window:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = AnimationUtils