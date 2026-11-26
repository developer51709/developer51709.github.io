import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DISCORD_PROFILE_URL, type DiscordProfile } from '../utils/discord'

interface TerminalProps {
  onCommand: (command: string) => string
  discord: DiscordProfile | null
}

interface Block {
  id: number
  html: string
}

interface FsEntry {
  type: 'dir' | 'file'
  content?: string
}

type Fs = Record<string, FsEntry>

const USER = 'soren'
const HOST = 'portfolio'
const HOME = '/home/soren'
const KERNEL = '6.8.0-portfolio'
const HISTORY_KEY = 'portfolio-terminal-history'

/* ===== Virtual filesystem ===== */

const FS: Record<string, FsEntry> = {
  '/': { type: 'dir' },
  '/bin': { type: 'dir' },
  '/dev': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/hostname': { type: 'file', content: `${HOST}\n` },
  '/etc/os-release': {
    type: 'file',
    content: [
      'PRETTY_NAME="Ubuntu 24.04.1 LTS"',
      'NAME="Ubuntu"',
      'VERSION_ID="24.04"',
      'VERSION="24.04.1 LTS (Noble Numbat)"',
      'ID=ubuntu',
      'HOME_URL="https://www.ubuntu.com/"',
      '',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/soren': { type: 'dir' },
  '/home/soren/.bashrc': {
    type: 'file',
    content: [
      '# ~/.bashrc: executed by bash(1) for non-login shells.',
      '',
      'export PATH="$HOME/bin:$PATH"',
      "alias ll='ls -la'",
      "alias ..='cd ..'",
      "alias grep='grep --color=auto'",
      "PS1='\\u@\\h:\\w\\$ '",
      '',
    ].join('\n'),
  },
  '/home/soren/.secret': {
    type: 'file',
    content: 'you found it. the konami code still works, by the way.\n',
  },
  '/home/soren/README.md': {
    type: 'file',
    content: [
      '# soren',
      '',
      'Full-stack developer building modern web and bot experiences.',
      '',
      '  Location  United States',
      '  Focus     full-stack development, AI integrations, backend systems',
      '  Stack     TypeScript, React, Node.js, PHP, Python',
      '',
      "Try 'cat about.txt', or 'cd projects' to look around.",
      '',
    ].join('\n'),
  },
  '/home/soren/about.txt': {
    type: 'file',
    content: [
      'soren',
      '-----',
      'Full-stack developer from the United States.',
      '',
      'I build modern web and bot experiences - exploring clean design,',
      'smooth interactions, and creative development. My work spans the',
      'full stack: backends, AI integrations, and polished frontends.',
      '',
      'I enjoy solving complex problems with clean, maintainable code and',
      'building products that are both functional and well-designed.',
      '',
    ].join('\n'),
  },
  '/home/soren/skills.txt': {
    type: 'file',
    content: [
      'Languages  PHP, JavaScript, Python, TypeScript',
      'Frontend   React, HTML/CSS, Tailwind',
      'Backend    Node.js, Laravel, Nest.js, REST APIs',
      'Databases  MySQL, PostgreSQL',
      'DevOps     Git, Docker',
      'AI         integrations, prompt engineering, LLM tooling',
      'Other      Discord bots, workflow automation, web design, PHPUnit',
      '',
    ].join('\n'),
  },
  '/home/soren/projects': { type: 'dir' },
  '/home/soren/projects/linavo': { type: 'dir' },
  '/home/soren/projects/linavo/README.md': {
    type: 'file',
    content: ['# Linavo', '', 'Discord bot and dashboard.', 'Node.js, Laravel, PostgreSQL.', ''].join('\n'),
  },
  '/home/soren/projects/niko': { type: 'dir' },
  '/home/soren/projects/niko/README.md': {
    type: 'file',
    content: ['# Niko', '', 'AI-powered assistant.', 'Node.js, React, LLM tooling.', ''].join('\n'),
  },
  '/home/soren/projects/portfolio': { type: 'dir' },
  '/home/soren/projects/portfolio/README.md': {
    type: 'file',
    content: ["# portfolio", '', "You are reading it. React + Vite + TypeScript.", ''].join('\n'),
  },
  '/home/soren/projects/portfolio/package.json': {
    type: 'file',
    content: [
      '{',
      '  "name": "developer51709-portfolio",',
      '  "private": true,',
      '  "version": "1.0.0",',
      '  "type": "module"',
      '}',
      '',
    ].join('\n'),
  },
  '/home/soren/projects/portfolio/src': { type: 'dir' },
  '/tmp': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
}

function contactFileContent(discord: DiscordProfile | null): string {
  return [
    `Discord:  ${discord ? `@${discord.username}` : DISCORD_PROFILE_URL}`,
    'Email:    developer51709@proton.me',
    'Phone:    +1 (762) 435-4135',
    'GitHub:   github.com/developer51709',
    'YouTube:  youtube.com/@sorenthedev',
    'Bluesky:  sorenthedev.bsky.social',
    'TikTok:   tiktok.com/@sorenthedev',
    'Twitch:   twitch.tv/sorenthedev',
    '',
  ].join('\n')
}

const SHELL_COMMANDS = [
  'cd',
  'ls',
  'll',
  'pwd',
  'cat',
  'tree',
  'clear',
  'history',
  'uname',
  'uptime',
  'hostname',
  'ps',
  'df',
  'env',
  'man',
  'sudo',
  'exit',
  'rm',
]

const APP_COMMANDS = [
  'help',
  'about',
  'projects',
  'contact',
  'skills',
  'age',
  'whoami',
  'echo',
  'date',
  'neofetch',
  'matrix',
]

const COMPLETION_COMMANDS = [...new Set([...SHELL_COMMANDS, ...APP_COMMANDS])]

const PATH_COMMANDS = new Set(['cd', 'ls', 'll', 'cat', 'tree', 'man'])

const MAN_PAGES: Record<string, string> = {
  cd: 'change the working directory',
  ls: 'list directory contents',
  ll: 'list directory contents in long format',
  pwd: 'print name of current working directory',
  cat: 'concatenate files and print on the standard output',
  tree: 'list contents of directories in a tree-like format',
  clear: 'clear the terminal screen',
  history: 'display the command history list',
  uname: 'print system information',
  uptime: 'tell how long the system has been running',
  hostname: 'show the system host name',
  ps: 'report a snapshot of the current processes',
  df: 'report file system disk space usage',
  env: 'print the environment',
  man: 'an interface to the system reference manuals',
  sudo: 'execute a command as another user',
  exit: 'cause the shell to exit',
  help: 'show the available portfolio commands',
}

/* ===== Path helpers ===== */

function parentOf(path: string): string {
  if (path === '/') return '/'
  const index = path.lastIndexOf('/')
  return index <= 0 ? '/' : path.slice(0, index)
}

function baseOf(path: string): string {
  if (path === '/') return '/'
  return path.slice(path.lastIndexOf('/') + 1)
}

function joinPath(dir: string, name: string): string {
  return dir === '/' ? `/${name}` : `${dir}/${name}`
}

function normalizePath(path: string): string {
  const parts = path.split('/')
  const stack: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return `/${stack.join('/')}`
}

function resolvePath(cwd: string, arg: string, previous: string): string {
  if (!arg || arg === '~') return HOME
  if (arg === '-') return previous
  if (arg.startsWith('~/')) return normalizePath(HOME + arg.slice(1))
  if (arg.startsWith('/')) return normalizePath(arg)
  return normalizePath(joinPath(cwd, arg))
}

function displayPath(path: string): string {
  if (path === HOME) return '~'
  if (path.startsWith(`${HOME}/`)) return `~${path.slice(HOME.length)}`
  return path
}

function isDir(fs: Fs, path: string): boolean {
  return fs[path]?.type === 'dir'
}

function childNames(fs: Fs, dir: string): string[] {
  return Object.keys(fs)
    .filter((path) => path !== '/' && parentOf(path) === dir)
    .map(baseOf)
    .sort((a, b) => a.localeCompare(b))
}

/* ===== Formatting helpers ===== */

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tokenize(raw: string): string[] {
  const tokens = raw.match(/"[^"]*"|'[^']*'|\S+/g) ?? []
  return tokens.map((token) => token.replace(/^(['"])([\s\S]*)\1$/, '$2'))
}

function nameClass(name: string, dir: boolean): string {
  if (dir) return 'terminal-ls-dir'
  if (name.startsWith('.')) return 'terminal-ls-hidden'
  return 'terminal-ls-file'
}

function promptHtml(path: string): string {
  return `<span class="terminal-prompt-user">${USER}@${HOST}</span><span class="terminal-prompt-dim">:</span><span class="terminal-prompt-path">${escapeHtml(displayPath(path))}</span><span class="terminal-prompt-dim">$</span>`
}

function lsColumns(fs: Fs, dir: string, all: boolean): string {
  const names = childNames(fs, dir).filter((name) => all || !name.startsWith('.'))
  if (names.length === 0) return ''
  return names
    .map((name) => {
      const entry = fs[joinPath(dir, name)]
      return `<span class="terminal-ls-item ${nameClass(name, entry.type === 'dir')}">${escapeHtml(name)}</span>`
    })
    .join('')
}

function lsLong(fs: Fs, dir: string, all: boolean): string {
  const names = childNames(fs, dir).filter((name) => all || !name.startsWith('.'))
  const now = new Date()
  const stamp = `${now.toLocaleDateString('en-US', { month: 'short' })} ${String(now.getDate()).padStart(2, ' ')} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`

  const rows = [
    { mode: 'drwxr-xr-x', links: 2 + names.filter((name) => isDir(fs, joinPath(dir, name))).length, size: 4096, name: '.', dir: true, hidden: false },
    { mode: 'drwxr-xr-x', links: 3, size: 4096, name: '..', dir: true, hidden: false },
    ...names.map((name) => {
      const entry = fs[joinPath(dir, name)]
      return {
        mode: entry.type === 'dir' ? 'drwxr-xr-x' : name.startsWith('.') ? '-rw-------' : '-rw-r--r--',
        links: entry.type === 'dir' ? 2 : 1,
        size: entry.type === 'dir' ? 4096 : (entry.content ?? '').length,
        name,
        dir: entry.type === 'dir',
        hidden: name.startsWith('.'),
      }
    }),
  ]

  const lines = rows.map((row) => {
    const links = String(row.links).padStart(2, ' ')
    const size = String(row.size).padStart(5, ' ')
    return `${row.mode} ${links} ${USER.padEnd(5, ' ')} ${USER.padEnd(5, ' ')} ${size} ${stamp} <span class="${nameClass(row.name, row.dir)}">${escapeHtml(row.name)}</span>`
  })

  return [`total ${rows.length * 4}`, ...lines].join('\n')
}

function treeOutput(fs: Fs, root: string): string {
  const lines = [displayPath(root)]
  const walk = (dir: string, prefix: string) => {
    const names = childNames(fs, dir).filter((name) => !name.startsWith('.'))
    names.forEach((name, index) => {
      const last = index === names.length - 1
      const full = joinPath(dir, name)
      const dirEntry = isDir(fs, full)
      lines.push(
        `${prefix}${last ? '└── ' : '├── '}<span class="${nameClass(name, dirEntry)}">${escapeHtml(name)}</span>`,
      )
      if (dirEntry) walk(full, `${prefix}${last ? '    ' : '│   '}`)
    })
  }
  walk(root, '')
  return lines.join('\n')
}

function manPage(topic: string): string {
  const summary = MAN_PAGES[topic]
  if (!summary) return `<span class="terminal-error">No manual entry for ${escapeHtml(topic)}</span>`
  const title = `${topic.toUpperCase()}(1)`
  return [
    `${title.padEnd(30)}User Commands${title.padStart(title.length + 23)}`,
    '',
    'NAME',
    `       ${topic} - ${summary}`,
    '',
    'SYNOPSIS',
    `       ${topic} [OPTION]... [FILE]...`,
    '',
    'DESCRIPTION',
    `       ${summary}.`,
    '       Handled locally by the portfolio shell.',
    '',
    'SEE ALSO',
    '       help(1)',
  ].join('\n')
}

function buildMotd(): string {
  const now = new Date()
  const login = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `<span class="terminal-out">Welcome to Ubuntu 24.04.1 LTS (GNU/Linux ${KERNEL} x86_64)

 * Documentation:  <a href="https://github.com/developer51709" target="_blank" rel="noopener noreferrer">github.com/developer51709</a>
 * Support:        developer51709@proton.me

System information as of ${login} ${time}

Last login: ${now.toString()} on pts/0
Type <span class="terminal-hl">help</span> for available commands, or <span class="terminal-hl">ls</span> to look around.</span>`
}

function commonPrefix(values: string[]): string {
  if (values.length === 0) return ''
  let prefix = values[0]
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}

type ShellResult = { output?: string; clear?: boolean; cwd?: string }

/* ===== Component ===== */

export function Terminal({ onCommand, discord }: TerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)
  const startedAt = useRef(Date.now())

  const [value, setValue] = useState('')
  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)
  const [cwd, setCwd] = useState(HOME)
  const [previousCwd, setPreviousCwd] = useState(HOME)
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]')
      return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  })
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [blocks, setBlocks] = useState<Block[]>(() => [{ id: 0, html: buildMotd() }])
  const fs = useMemo<Fs>(
    () => ({ ...FS, [`${HOME}/contact.txt`]: { type: 'file', content: contactFileContent(discord) } }),
    [discord],
  )

  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [blocks])

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)))
    } catch {
      /* storage unavailable */
    }
  }, [history])

  const setLine = useCallback((next: string) => {
    setValue(next)
    setCaret(next.length)
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(next.length, next.length)
    })
  }, [])

  const appendBlock = useCallback((html: string) => {
    setBlocks((prev) => [...prev, { id: nextId.current++, html }])
  }, [])

  function runShell(raw: string): ShellResult | undefined {
    const argv = tokenize(raw)
    const command = argv[0]
    const args = argv.slice(1)
    const flags = args.filter((arg) => arg.startsWith('-'))
    const operands = args.filter((arg) => !arg.startsWith('-'))
    const has = (flag: string) => flags.some((value) => value.startsWith('--') || value.slice(1).includes(flag))
    const error = (message: string) => `<span class="terminal-error">${escapeHtml(message)}</span>`

    switch (command) {
      case 'pwd':
        return { output: escapeHtml(displayPath(cwd)) }

      case 'cd': {
        const target = operands[0]
        const next = resolvePath(cwd, target ?? '~', previousCwd)
        if (!fs[next]) return { output: error(`bash: cd: ${target}: No such file or directory`) }
        if (!isDir(fs, next)) return { output: error(`bash: cd: ${target}: Not a directory`) }
        if (next === cwd) return {}
        return { cwd: next, output: target === '-' ? escapeHtml(displayPath(next)) : '' }
      }

      case 'ls':
      case 'll': {
        const long = command === 'll' || has('l')
        const all = command === 'll' || has('a')
        const target = operands[0]
        const path = target ? resolvePath(cwd, target, previousCwd) : cwd
        const entry = fs[path]
        if (!entry) return { output: error(`ls: cannot access '${target}': No such file or directory`) }
        if (entry.type === 'file') {
          return { output: `<span class="${nameClass(baseOf(path), false)}">${escapeHtml(baseOf(path))}</span>` }
        }
        return { output: long ? lsLong(fs, path, all) : lsColumns(fs, path, all) }
      }

      case 'cat': {
        if (operands.length === 0) return { output: error('cat: missing file operand') }
        const parts = operands.map((name) => {
          const path = resolvePath(cwd, name, previousCwd)
          const entry = fs[path]
          if (!entry) return error(`cat: ${name}: No such file or directory`)
          if (entry.type === 'dir') return error(`cat: ${name}: Is a directory`)
          return escapeHtml(entry.content ?? '')
        })
        return { output: parts.join('\n') }
      }

      case 'tree': {
        const path = operands[0] ? resolvePath(cwd, operands[0], previousCwd) : cwd
        if (!fs[path]) return { output: error(`tree: ${operands[0]}: No such file or directory`) }
        if (!isDir(fs, path)) return { output: escapeHtml(baseOf(path)) }
        return { output: treeOutput(fs, path) }
      }

      case 'clear':
        return { clear: true }

      case 'history': {
        if (history.length === 0) return { output: '' }
        return {
          output: history
            .map((entry, index) => `${String(index + 1).padStart(4, ' ')}  ${escapeHtml(entry)}`)
            .join('\n'),
        }
      }

      case 'uname': {
        if (has('a')) {
          return {
            output: `Linux ${HOST} ${KERNEL} #1 SMP PREEMPT_DYNAMIC Wed Nov 26 09:14:33 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`,
          }
        }
        if (has('r')) return { output: KERNEL }
        if (has('n')) return { output: HOST }
        return { output: 'Linux' }
      }

      case 'uptime': {
        const seconds = Math.floor((Date.now() - startedAt.current) / 1000)
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const clock = new Date().toTimeString().slice(0, 8)
        const pretty = hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}` : `${minutes} min`
        return {
          output: ` ${clock} up ${pretty},  1 user,  load average: 0.08, 0.12, 0.09`,
        }
      }

      case 'hostname':
        return { output: HOST }

      case 'ps':
        return {
          output: [
            'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
            'root         1  0.0  0.1  22544  9104 ?        Ss   09:14   0:02 /sbin/init',
            'soren      412  0.3  1.2 991204 98432 ?        Sl   09:14   0:11 node vite',
            'soren      518  0.0  0.4  18220  7456 pts/0    Ss   09:21   0:00 -bash',
            'soren      733  0.0  0.2  10240  3840 pts/0    R+   09:41   0:00 ps aux',
          ].join('\n'),
        }

      case 'df':
        return {
          output: [
            'Filesystem      Size  Used Avail Use% Mounted on',
            '/dev/sda1        64G   21G   40G  35% /',
            'tmpfs           3.9G     0  3.9G   0% /dev/shm',
            '/dev/sda15      105M  6.1M   99M   6% /boot/efi',
          ].join('\n'),
        }

      case 'env':
        return {
          output: [
            'SHELL=/bin/bash',
            `USER=${USER}`,
            `HOME=${HOME}`,
            `PWD=${cwd}`,
            `OLDPWD=${previousCwd}`,
            'LANG=en_US.UTF-8',
            'TERM=xterm-256color',
            'EDITOR=vim',
          ].join('\n'),
        }

      case 'man': {
        if (operands.length === 0) return { output: error('What manual page do you want?') }
        return { output: manPage(operands[0]) }
      }

      case 'sudo': {
        if (operands.length === 0 && flags.length === 0) {
          return { output: 'usage: sudo -h | -K | -k | -V' }
        }
        return {
          output: `${USER} is not in the sudoers file.  This incident has been reported.`,
        }
      }

      case 'rm':
        return { output: error(`rm: cannot remove '${operands[0] ?? ''}': Read-only file system`) }

      case 'exit':
      case 'logout':
        return { output: 'logout' }

      case 'whoami':
        return { output: USER }

      default:
        return undefined
    }
  }

  function execute(raw: string) {
    const cmdline = `<div class="terminal-cmdline">${promptHtml(cwd)} <span class="terminal-typed">${escapeHtml(raw)}</span></div>`

    if (!raw.trim()) {
      appendBlock(cmdline)
      return
    }

    setHistory((prev) => (prev[prev.length - 1] === raw ? prev : [...prev, raw]))
    setHistoryIndex(-1)

    const result = runShell(raw)

    if (result?.clear) {
      setBlocks([])
      return
    }

    if (result?.cwd) {
      setPreviousCwd(cwd)
      setCwd(result.cwd)
    }

    const output = result ? (result.output ?? '') : onCommand(raw)
    appendBlock(output ? `${cmdline}<div class="terminal-out">${output}</div>` : cmdline)
  }

  function complete() {
    const trailingSpace = /\s$/.test(value)
    const lastToken = trailingSpace ? '' : (value.split(/\s+/).pop() ?? '')
    const head = value.slice(0, value.length - lastToken.length)
    const command = value.trimStart().split(/\s+/)[0] ?? ''
    const completingPath = !trailingSpace ? value.slice(0, value.length - lastToken.length).trim() !== '' : true

    let suggestions: string[]
    if (!completingPath) {
      suggestions = COMPLETION_COMMANDS.filter((candidate) => candidate.startsWith(lastToken))
    } else if (PATH_COMMANDS.has(command) || command === '') {
      const slash = lastToken.lastIndexOf('/')
      const dirPart = slash >= 0 ? lastToken.slice(0, slash + 1) : ''
      const base = slash >= 0 ? lastToken.slice(slash + 1) : lastToken
      const baseDir = slash >= 0 ? resolvePath(cwd, dirPart, previousCwd) : cwd
      if (!isDir(fs, baseDir)) return
      suggestions = childNames(fs, baseDir)
        .filter((name) => name.startsWith(base))
        .map((name) => `${dirPart}${name}${isDir(fs, joinPath(baseDir, name)) ? '/' : ''}`)
    } else {
      return
    }

    if (suggestions.length === 0) return
    if (suggestions.length === 1) {
      setLine(head + suggestions[0])
      return
    }

    const shared = commonPrefix(suggestions)
    if (shared.length > lastToken.length) setLine(head + shared)
    appendBlock(
      `<div class="terminal-out terminal-completions">${suggestions.map((item) => escapeHtml(item)).join('   ')}</div>`,
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const raw = value
      setLine('')
      execute(raw)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      complete()
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setLine(history[next])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === -1) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(-1)
        setLine('')
      } else {
        setHistoryIndex(next)
        setLine(history[next])
      }
      return
    }

    if (event.ctrlKey && !event.metaKey && !event.altKey) {
      const key = event.key.toLowerCase()
      if (key === 'l') {
        event.preventDefault()
        setBlocks([])
        return
      }
      if (key === 'c') {
        event.preventDefault()
        appendBlock(
          `<div class="terminal-cmdline">${promptHtml(cwd)} <span class="terminal-typed">${escapeHtml(value)}</span><span class="terminal-dim">^C</span></div>`,
        )
        setLine('')
        return
      }
      if (key === 'u') {
        event.preventDefault()
        setLine('')
        return
      }
      if (key === 'd' && value === '') {
        event.preventDefault()
        appendBlock('<div class="terminal-out">logout</div>')
      }
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value)
    setCaret(event.target.selectionStart ?? event.target.value.length)
  }

  function handleOutputClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('a, button')) return
    inputRef.current?.focus()
  }

  const before = value.slice(0, Math.min(caret, value.length))
  const at = value[caret] ?? ' '
  const after = value.slice(caret + 1)

  return (
    <div className="content scroll-reveal" style={{ marginTop: '2rem' }}>
      <h2 className="section-title">Terminal</h2>
      <div className="terminal-window">
        {/* Title bar */}
        <div className="terminal-titlebar">
          <span className="terminal-dot" style={{ backgroundColor: '#ff5f57' }} />
          <span className="terminal-dot" style={{ backgroundColor: '#febc2e' }} />
          <span className="terminal-dot" style={{ backgroundColor: '#28c840' }} />
          <span className="terminal-titlebar-text">
            {USER}@{HOST}: {displayPath(cwd)} — bash
          </span>
        </div>
        {/* Output area */}
        <div
          ref={outputRef}
          className="terminal-output"
          role="log"
          aria-live="polite"
          onClick={handleOutputClick}
        >
          {blocks.map((block) => (
            <div key={block.id} className="terminal-block" dangerouslySetInnerHTML={{ __html: block.html }} />
          ))}
        </div>
        {/* Input area */}
        <div className="terminal-input-row" onClick={() => inputRef.current?.focus()}>
          <span className="terminal-prompt" dangerouslySetInnerHTML={{ __html: promptHtml(cwd) }} />
          <div className="terminal-line">
            <span className="terminal-mirror" aria-hidden="true">
              {before}
              <span className={focused ? 'terminal-cursor' : 'terminal-cursor terminal-cursor-idle'}>
                {at === ' ' ? '\u00a0' : at}
              </span>
              {after}
            </span>
            <input
              ref={inputRef}
              className="terminal-input"
              type="text"
              value={value}
              aria-label="Terminal input"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
              onClick={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '0.5rem', textAlign: 'center' }}>
        ↑↓ history · Tab complete · Ctrl+C cancel · Ctrl+L clear
      </p>
    </div>
  )
}
