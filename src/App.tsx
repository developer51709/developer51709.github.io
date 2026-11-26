import { useState, useCallback, useEffect } from 'react'
import { MatrixRain } from './components/MatrixRain'
import { CrtOverlay } from './components/CrtOverlay'
import { BootSequence } from './components/BootSequence'
import { Hero } from './components/Hero'
import { Terminal } from './components/Terminal'
import { Projects } from './components/Projects'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { getAge } from './utils/age'
import { useLanyard } from './hooks/useLanyard'
import { DISCORD_PROFILE_URL, type DiscordProfile } from './utils/discord'

const HELP_TEXT = `<span style="color:#00ff00;">Available commands:</span>

  <span style="color:cyan;">help</span>       — show this message
  <span style="color:cyan;">about</span>      — who I am
  <span style="color:cyan;">projects</span>   — list my projects
  <span style="color:cyan;">contact</span>    — reach me
  <span style="color:cyan;">skills</span>     — my technical skills
  <span style="color:cyan;">age</span>        — how old I am
  <span style="color:cyan;">whoami</span>     — identity check
  <span style="color:cyan;">date</span>       — current date &amp; time
  <span style="color:cyan;">neofetch</span>   — system info
  <span style="color:cyan;">echo</span> &lt;msg&gt; — echo a message
  <span style="color:cyan;">matrix</span>     — toggle the matrix rain
  <span style="color:cyan;">clear</span>      — clear the terminal

<span style="color:#00ff00;">Shell:</span>
  <span style="color:cyan;">ls</span> [-la]    — list directory contents
  <span style="color:cyan;">cd</span> &lt;dir&gt;   — change directory
  <span style="color:cyan;">cat</span> &lt;file&gt; — print a file
  <span style="color:cyan;">pwd</span>        — print working directory
  <span style="color:cyan;">tree</span>       — directory tree
  <span style="color:cyan;">history</span>    — command history
  <span style="color:cyan;">uname -a</span>   — kernel &amp; system info
  <span style="color:cyan;">uptime</span>, <span style="color:cyan;">ps</span>, <span style="color:cyan;">df</span>, <span style="color:cyan;">env</span>, <span style="color:cyan;">man</span> &lt;cmd&gt;, <span style="color:cyan;">sudo</span>, <span style="color:cyan;">exit</span>

  <span style="color:rgba(255,255,255,0.3);">↑↓ history · Tab complete · Ctrl+C cancel · Ctrl+L clear</span>`

function buildAboutText(): string {
  const age = getAge()
  return `<span style="color:#00ff00;">▸ soren</span>
  Age:      ${age}
  Location: United States
  Focus:    Full-stack development, AI integrations, backend systems

  I build modern web and bot experiences — exploring clean design,
  smooth interactions, and creative development. My work spans the
  full stack: backends, AI integrations, and polished frontends.

  I enjoy solving complex problems with clean, maintainable code and
  building products that are both functional and well-designed.`
}

function buildContactText(discord: DiscordProfile | null): string {
  const handle = discord ? `@${discord.username}` : 'view profile'
  return `<span style="color:#00ff00;">▸ Contact Information</span>

  Discord:  <a href="${DISCORD_PROFILE_URL}" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">${escapeHtmlStr(handle)}</a>
  Email:    developer51709@proton.me
  Phone:    +1 (762) 435-4135
  GitHub:   <a href="https://github.com/developer51709" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">github.com/developer51709</a>
  YouTube:  <a href="https://youtube.com/@sorenthedev" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">@sorenthedev</a>
  Bluesky:  <a href="https://bsky.app/profile/sorenthedev.bsky.social" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">sorenthedev.bsky.social</a>
  TikTok:   <a href="https://tiktok.com/@sorenthedev" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">@sorenthedev</a>
  Twitch:   <a href="https://twitch.tv/sorenthedev" target="_blank" rel="noopener noreferrer" class="glitch" style="color:cyan;">sorenthedev</a>`
}

const SKILLS_TEXT = `<span style="color:#00ff00;">▸ Technical Skills</span>

  <span style="color:cyan;">Languages:</span>    PHP, JavaScript, Python, TypeScript
  <span style="color:cyan;">Frontend:</span>     React, HTML/CSS, Tailwind
  <span style="color:cyan;">Backend:</span>      Node.js, Laravel, Nest.js, REST APIs
  <span style="color:cyan;">Databases:</span>    MySQL, PostgreSQL
  <span style="color:cyan;">DevOps:</span>       Git, Docker
  <span style="color:cyan;">AI:</span>           AI integrations, prompt engineering, LLM tooling
  <span style="color:cyan;">Other:</span>        Discord bots, workflow automation, web design, PHPUnit`

const PAGE_START = Date.now()

const NEOFETCH_LOGO = [
  '        .--.',
  '       |o_o |',
  '       |:_/ |',
  '      //   \\ \\',
  '     (|     | )',
  "    /'\\_   _/`\\",
  '    \\___)=(___/',
]

const NEOFETCH_LOGO_TONES = [
  'nf-logo-bright',
  'nf-logo-bright',
  'nf-logo-bright',
  'nf-logo-mid',
  'nf-logo-mid',
  'nf-logo-dim',
  'nf-logo-dim',
]

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds} secs`
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}, ${seconds % 60} secs`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours === 1 ? '' : 's'}, ${minutes % 60} mins`
}

function buildNeofetch(): string {
  const rows: string[] = [
    '<span class="nf-user">soren</span><span class="nf-at">@</span><span class="nf-host">portfolio</span>',
    `<span class="nf-sep">${'-'.repeat(24)}</span>`,
  ]

  const info: Array<[string, string]> = [
    ['OS', 'Ubuntu 24.04 LTS'],
    ['Host', 'sorenthedev.indevs.in'],
    ['Kernel', 'React 18 + TypeScript'],
    ['Shell', 'portfolio-bash 2.0'],
    ['Terminal', 'web-terminal'],
    ['DE', 'Matrix Rain + CRT'],
    ['Theme', 'Cyberpunk Green'],
    ['Resolution', `${window.innerWidth}x${window.innerHeight}`],
    ['Uptime', formatUptime(Date.now() - PAGE_START)],
  ]

  for (const [key, value] of info) {
    rows.push(
      `<span class="nf-key">${`${key}:`.padEnd(11, ' ')}</span> <span class="nf-value">${value}</span>`,
    )
  }

  rows.push('')
  rows.push(
    ['#1a1a1a', '#ff5555', '#00ff00', '#ffd866', '#4ea1ff', '#ff79c6', '#8be9fd', '#e6e6e6']
      .map((color) => `<span class="nf-swatch" style="background:${color}"></span>`)
      .join(''),
  )

  const logoWidth = Math.max(...NEOFETCH_LOGO.map((line) => line.length))
  const height = Math.max(NEOFETCH_LOGO.length, rows.length)
  const lines: string[] = []

  for (let index = 0; index < height; index += 1) {
    const art = NEOFETCH_LOGO[index] ?? ''
    const tone = NEOFETCH_LOGO_TONES[index] ?? 'nf-logo-dim'
    const logo = art
      ? `<span class="nf-logo ${tone}">${art.padEnd(logoWidth, ' ').replace('o_o', '<span class="nf-eye">o_o</span>')}</span>`
      : `<span class="nf-logo">${' '.repeat(logoWidth)}</span>`
    lines.push(`${logo}  ${rows[index] ?? ''}`)
  }

  return lines.join('\n')
}

function App() {
  const [booted, setBooted] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [matrixVisible, setMatrixVisible] = useState(true)
  const [easterEgg, setEasterEgg] = useState(false)
  const { profile: discord, loading: discordLoading } = useLanyard()

  // Konami code easter egg
  useEffect(() => {
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
    let buffer: string[] = []

    function handleKey(e: KeyboardEvent) {
      buffer.push(e.key)
      if (buffer.length > KONAMI.length) buffer = buffer.slice(-KONAMI.length)
      if (buffer.join(',') === KONAMI.join(',')) {
        setEasterEgg(true)
        buffer = []
        setTimeout(() => setEasterEgg(false), 5000)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleCommand = useCallback((input: string): string => {
    const cmd = input.toLowerCase().trim()

    if (cmd === 'help') return HELP_TEXT
    if (cmd === 'about') return buildAboutText()
    if (cmd === 'contact') return buildContactText(discord)
    if (cmd === 'skills') return SKILLS_TEXT
    if (cmd === 'age') return `I'm ${getAge()} years old.`
    if (cmd === 'whoami') return '<span style="color:#00ff00;">soren</span> — full-stack developer, AI integrations, creative coder.'
    if (cmd === 'date') return `<span style="color:#e0e0e0;">${new Date().toString()}</span>`
    if (cmd === 'neofetch') return buildNeofetch()
    if (cmd === 'matrix') {
      setMatrixVisible((prev) => !prev)
      return matrixVisible
        ? '<span style="color:yellow;">Matrix rain disabled.</span>'
        : '<span style="color:yellow;">Matrix rain enabled.</span>'
    }
    if (cmd.startsWith('echo ')) return `<span style="color:#e0e0e0;">${escapeHtmlStr(input.slice(5))}</span>`

    if (cmd === 'projects') {
      setShowProjects((prev) => !prev)
      return showProjects
        ? '<span style="color:yellow;">Hiding project cards.</span>'
        : '<span style="color:yellow;">Displaying project cards below.</span>'
    }

    return `<span style="color:#ff5555;">bash: ${escapeHtmlStr(input.split(/\s+/)[0])}: command not found</span>\nType <span style="color:cyan;">help</span> for available commands.`
  }, [showProjects, matrixVisible, discord])

  return (
    <>
      {matrixVisible && <MatrixRain />}
      {easterEgg && <div className="easter-egg-overlay" aria-hidden="true" />}
      <CrtOverlay />

      {!booted && <BootSequence onComplete={() => setBooted(true)} />}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: booted && !discordLoading ? 1 : 0,
          transition: 'opacity 0.8s ease-in',
        }}
      >
        <Hero />
        <Terminal onCommand={handleCommand} discord={discord} />
        <Projects visible={showProjects} />
        <Contact discord={discord} />
        <Footer />
      </div>
    </>
  )
}

function escapeHtmlStr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default App
