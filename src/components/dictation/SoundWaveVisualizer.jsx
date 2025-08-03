import React, { useEffect, useRef } from 'react'

const SoundWaveVisualizer = ({ audioLevel = 0, isRecording = false, isAgentMode = false, className = '' }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const barsRef = useRef([])

  const BARS_COUNT = 8
  const BAR_WIDTH = 4
  const BAR_GAP = 2
  const MAX_HEIGHT = 20
  const MIN_HEIGHT = 3

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // Initialize bars with random heights for idle state
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: BARS_COUNT }, () => ({
        height: MIN_HEIGHT,
        targetHeight: MIN_HEIGHT,
        velocity: 0,
      }))
    }

    const animate = () => {
      // Clear with dark background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      const centerY = canvasHeight / 2
      const totalWidth = BARS_COUNT * BAR_WIDTH + (BARS_COUNT - 1) * BAR_GAP
      const startX = (canvasWidth - totalWidth) / 2

      barsRef.current.forEach((bar, index) => {
        if (isRecording) {
          // Active recording: respond to audio level with some randomness
          const baseHeight = MIN_HEIGHT + audioLevel * (MAX_HEIGHT - MIN_HEIGHT)
          const randomMultiplier = 0.5 + Math.random() * 1.0
          bar.targetHeight = Math.max(MIN_HEIGHT, baseHeight * randomMultiplier)
        } else {
          // Idle state: gentle random movement
          if (Math.random() < 0.1) {
            bar.targetHeight = MIN_HEIGHT + Math.random() * 8
          }
        }

        // Smooth animation using spring physics
        const spring = 0.2
        const damping = 0.8
        const force = (bar.targetHeight - bar.height) * spring
        bar.velocity = (bar.velocity + force) * damping
        bar.height += bar.velocity

        // Ensure minimum height
        bar.height = Math.max(MIN_HEIGHT, bar.height)

        const x = startX + index * (BAR_WIDTH + BAR_GAP)
        const barHeight = Math.min(bar.height, MAX_HEIGHT)

        if (isRecording) {
          if (isAgentMode) {
            // Green color when recording in agent mode
            ctx.fillStyle = '#9ae600' // green-500
          } else {
            // White color when recording in normal mode
            ctx.fillStyle = '#ffffff'
          }
        } else {
          if (isAgentMode) {
            // Green gradient when idle in agent mode
            const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2)
            gradient.addColorStop(0, '#a3e635') // lime-400
            gradient.addColorStop(0.5, '#84cc16') // lime-500
            gradient.addColorStop(1, '#65a30d') // lime-600
            ctx.fillStyle = gradient
          } else {
            // Gray gradient when idle in normal mode
            const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2)
            gradient.addColorStop(0, '#9ca3af')
            gradient.addColorStop(0.5, '#6b7280')
            gradient.addColorStop(1, '#4b5563')
            ctx.fillStyle = gradient
          }
        }
        ctx.fillRect(x, centerY - barHeight / 2, BAR_WIDTH, barHeight)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioLevel, isRecording, isAgentMode])

  return (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
      <canvas ref={canvasRef} width={100} height={50} />
      {/* Debug fallback */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
    </div>
  )
}

export default SoundWaveVisualizer
