import { useEffect, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[]|/\\'

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let columns: number[]
    const fontSize = 14

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      const colCount = Math.floor(canvas!.width / fontSize)
      columns = Array.from({ length: colCount }, () =>
        Math.random() * canvas!.height / fontSize | 0
      )
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      ctx!.font = `${fontSize}px monospace`

      for (let i = 0; i < columns.length; i++) {
        const char = CHARS[Math.random() * CHARS.length | 0]
        const x = i * fontSize
        const y = columns[i] * fontSize

        // Bright leading character
        ctx!.fillStyle = '#0f0'
        ctx!.fillText(char, x, y)

        // Trailing character slightly dimmer
        if (Math.random() > 0.95) {
          ctx!.fillStyle = 'rgba(0, 255, 0, 0.8)'
          const trailChar = CHARS[Math.random() * CHARS.length | 0]
          ctx!.fillText(trailChar, x, y - fontSize)
        }

        if (y > canvas!.height && Math.random() > 0.975) {
          columns[i] = 0
        }
        columns[i]++
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.35,
      }}
    />
  )
}
