import { useEffect, useState } from 'react'

export function CrtOverlay() {
  const [flicker, setFlicker] = useState(1)

  useEffect(() => {
    let animId: number
    let lastTime = 0

    function animate(time: number) {
      // Subtle random flicker every ~100ms
      if (time - lastTime > 80 + Math.random() * 120) {
        setFlicker(0.97 + Math.random() * 0.03)
        lastTime = time
      }
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        opacity: flicker,
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
          zIndex: 1,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)',
          zIndex: 2,
        }}
      />
      {/* Subtle green tint flicker on top */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 255, 0, 0.01)',
          zIndex: 3,
        }}
      />
    </div>
  )
}
