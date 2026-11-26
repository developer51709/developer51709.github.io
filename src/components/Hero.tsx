import { useEffect, useState } from 'react'
import { getAge } from '../utils/age'

function buildLINES(): string[] {
  const age = getAge()
  return [
    'Welcome to my official profile page.',
    `About me: I am a ${age}-year-old developer from the United States. I build modern web and bot experiences — exploring clean design, smooth interactions, and creative development across web and bot projects. My work spans the full stack: backends, AI integrations, and polished frontends.`,
    'My focus areas: full-stack web development, AI integrations, backend systems, and immersive web experiences.',
    'Type help into the Terminal below to interact.',
  ]
}

const CHAR_DELAY = 22
const LINE_DELAY = 200

export function Hero() {
  const [lines] = useState(buildLINES)
  const [typedLines, setTypedLines] = useState<string[]>(['', '', '', ''])
  const [activeLine, setActiveLine] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [titleVisible, setTitleVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (activeLine >= lines.length) return

    const currentLine = lines[activeLine]

    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setTypedLines((prev) => {
          const next = [...prev]
          next[activeLine] = currentLine.slice(0, charIndex + 1)
          return next
        })
        setCharIndex(charIndex + 1)
      }, CHAR_DELAY)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setActiveLine(activeLine + 1)
        setCharIndex(0)
      }, LINE_DELAY)
      return () => clearTimeout(timer)
    }
  }, [activeLine, charIndex, lines])

  return (
    <div className="content" style={{ paddingTop: '4rem' }}>
      <h1
        className="glow-title"
        style={{
          fontSize: 'clamp(1.3rem, 5vw, 2.5rem)',
          marginBottom: '1.5rem',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          textShadow: '0 0 10px rgba(0,255,0,0.7), 0 0 30px rgba(0,255,0,0.3), 0 0 60px rgba(0,255,0,0.1)',
          letterSpacing: '2px',
        }}
      >
        {'> soren_'}
      </h1>
      {typedLines.map((text, i) => (
        <p
          key={i}
          id={`typed-text-${i + 1}`}
          className={i === activeLine && activeLine < lines.length ? 'typing' : undefined}
          style={{
            textShadow: '0 0 5px rgba(0,255,0,0.3)',
            lineHeight: '1.6',
          }}
        >
          {text}
        </p>
      ))}
    </div>
  )
}
