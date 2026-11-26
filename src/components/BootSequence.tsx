import { useEffect, useRef, useState } from 'react'

const BOOT_LINES = [
  { text: 'BIOS v2.04 — developer51709 systems', delay: 0 },
  { text: 'Memory check: 65536K OK', delay: 200 },
  { text: 'Initializing kernel modules...', delay: 400 },
  { text: 'Loading matrix_renderer... OK', delay: 600 },
  { text: 'Loading portfolio_driver... OK', delay: 800 },
  { text: 'Mounting /dev/creativity... OK', delay: 1000 },
  { text: 'Starting network interface... CONNECTED', delay: 1200 },
  { text: '', delay: 1500 },
  { text: '  ___                   ', delay: 1550 },
  { text: ' / __| ___ _ _ ___ _ _  ', delay: 1600 },
  { text: ' \\__ \\/ _ \\ \'_/ -_) \' \\ ', delay: 1650 },
  { text: ' |___/\\___/_| \\___|_||_|', delay: 1700 },
  { text: '', delay: 1750 },
  { text: 'System ready. Loading interface...', delay: 1800 },
]

interface BootSequenceProps {
  onComplete: () => void
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [fadeOut, setFadeOut] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Runs once per mount. The parent re-renders while the boot animation plays
  // (the Discord profile resolves during it), so the sequence must not restart
  // and reprint lines that are already on screen.
  useEffect(() => {
    setVisibleLines([])
    setFadeOut(false)

    const timers: ReturnType<typeof setTimeout>[] = []

    BOOT_LINES.forEach(({ text, delay }) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, text])
        }, delay)
      )
    })

    // Start fade out after all lines
    timers.push(
      setTimeout(() => setFadeOut(true), 2600)
    )

    // Complete after fade
    timers.push(
      setTimeout(() => onCompleteRef.current(), 3200)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <div
        style={{
          fontFamily: 'inherit',
          fontSize: '14px',
          color: '#00ff00',
          maxWidth: '700px',
          width: '100%',
          padding: '2rem',
          textShadow: '0 0 8px rgba(0,255,0,0.5)',
        }}
      >
        {visibleLines.map((line, i) => (
          <div key={i} style={{ whiteSpace: 'pre', lineHeight: '1.4' }}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  )
}
