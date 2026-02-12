'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const GREETING = 'Hi, welcome to my personal site. Nice to meet you.'
const CHAR_DELAY = 50
const CURSOR_BLINK = 530

const SLASH_COMMANDS: Record<string, string[]> = {}

const LINK_COMMANDS: Record<string, string> = {
  '/linkedin': 'https://www.linkedin.com/in/ragmha/',
}

// Microsoft logo as colored block pairs
const MS_LOGO = [
  ['red', 'red', 'red', ' ', 'green', 'green', 'green'],
  ['red', 'red', 'red', ' ', 'green', 'green', 'green'],
  ['red', 'red', 'red', ' ', 'green', 'green', 'green'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' '],
  ['blue', 'blue', 'blue', ' ', 'yellow', 'yellow', 'yellow'],
  ['blue', 'blue', 'blue', ' ', 'yellow', 'yellow', 'yellow'],
  ['blue', 'blue', 'blue', ' ', 'yellow', 'yellow', 'yellow'],
]

const COLOR_MAP: Record<string, string> = {
  red: 'bg-[#f25022]',
  green: 'bg-[#7fba00]',
  blue: 'bg-[#00a4ef]',
  yellow: 'bg-[#ffb900]',
}

const TOOL_LOGOS = [
  {
    name: 'Azure',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
  },
  { name: 'GitHub', src: 'https://cdn.simpleicons.org/github/ffffff' },
  {
    name: 'VS Code',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
  },
  { name: 'GitHub Copilot', src: 'https://cdn.simpleicons.org/githubcopilot/ffffff' },
]

interface HistoryEntry {
  type: 'input' | 'output' | 'greeting' | 'hint'
  text: string
}

export function Terminal() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [input, setInput] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [greetingDone, setGreetingDone] = useState(false)
  const [showSlashHint, setShowSlashHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), CURSOR_BLINK)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Streaming greeting on mount
  const streamGreeting = useCallback(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < GREETING.length) {
        setHistory([{ type: 'greeting', text: GREETING.slice(0, i + 1) }])
        i++
      } else {
        clearInterval(interval)
        setGreetingDone(true)
      }
    }, CHAR_DELAY)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cleanup = streamGreeting()
    return cleanup
  }, [streamGreeting])

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()

    setHistory((h) => [...h, { type: 'input', text: cmd }])

    if (LINK_COMMANDS[trimmed]) {
      const url = LINK_COMMANDS[trimmed]
      setHistory((h) => [
        ...h,
        { type: 'output', text: `Opening ${url} ...` },
      ])
      window.open(url, '_blank')
      return
    }

    if (SLASH_COMMANDS[trimmed]) {
      const lines = SLASH_COMMANDS[trimmed]
      setHistory((h) => [
        ...h,
        ...lines.map((text) => ({ type: 'output' as const, text })),
      ])
      return
    }

    if (trimmed.startsWith('/')) {
      setHistory((h) => [
        ...h,
        { type: 'output', text: `Unknown command: ${trimmed}` },
        { type: 'output', text: 'Available: /linkedin' },
      ])
      return
    }

    setHistory((h) => [
      ...h,
      { type: 'output', text: 'Available: /linkedin' },
    ])
  }

  const allCommands = [...Object.keys(SLASH_COMMANDS), ...Object.keys(LINK_COMMANDS)]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashHint) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHintIndex((i) => (i + 1) % allCommands.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHintIndex((i) => (i <= 0 ? allCommands.length - 1 : i - 1))
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && hintIndex >= 0)) {
        e.preventDefault()
        setInput(allCommands[hintIndex])
        setShowSlashHint(false)
        setHintIndex(-1)
        return
      }
      if (e.key === 'Escape') {
        setShowSlashHint(false)
        setHintIndex(-1)
        return
      }
    }
    if (e.key === 'Enter' && input.trim()) {
      handleCommand(input)
      setInput('')
      setShowSlashHint(false)
      setHintIndex(-1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    const show = val === '/'
    setShowSlashHint(show)
    if (show) setHintIndex(0)
    else setHintIndex(-1)
  }

  return (
    <div
      className="rounded-lg border border-surface0 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-mantle border-b border-surface0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink" />
          <span className="w-3 h-3 rounded-full bg-yellow" />
          <span className="w-3 h-3 rounded-full bg-green" />
        </div>
        <span className="text-sm text-overlay1 font-mono">raghib.io</span>
        <div className="w-[52px]" />
      </div>

      {/* Terminal body */}
      <div className="p-3 sm:p-5 bg-base font-mono text-sm leading-relaxed min-h-[250px] sm:min-h-[360px] max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {/* Tool logos */}
        <div className="flex items-center gap-4 mb-4 ml-1">
          <div className="grid grid-cols-7 gap-0" style={{ width: '28px', height: '28px' }}>
            {MS_LOGO.flat().map((color, i) => (
              <div
                key={i}
                className={color === ' ' ? '' : COLOR_MAP[color]}
                style={{ width: '4px', height: '4px' }}
              />
            ))}
          </div>
          {TOOL_LOGOS.map((logo) => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              title={logo.name}
              className="h-7 w-7 object-contain"
            />
          ))}
        </div>

        {/* History */}
        {history.map((entry, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {entry.type === 'input' ? (
              <div className="flex">
                <span className="text-green font-bold shrink-0">{'> '}</span>
                <span className="text-text">{entry.text}</span>
              </div>
            ) : entry.type === 'greeting' ? (
              <div className="flex">
                <span className="text-green font-bold shrink-0">{'$ '}</span>
                <span className="text-text">{entry.text}</span>
              </div>
            ) : entry.type === 'hint' ? (
              <div className="flex">
                <span className="text-green font-bold shrink-0">{'> '}</span>
                <span className="text-subtext0">{entry.text}</span>
              </div>
            ) : (
              <div className="text-subtext0 ml-4">{entry.text || '\u00A0'}</div>
            )}
          </div>
        ))}

        {/* Active input */}
        {greetingDone && (
          <div className="relative">
            <div className="flex items-center mt-1">
              <span className="text-green font-bold shrink-0">{'> '}</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent text-text outline-none w-full caret-green placeholder:text-subtext0"
                  placeholder="Type /linkedin"
                  autoFocus
                  spellCheck={false}
                  aria-label="Terminal input"
                />
              </div>
            </div>

            {/* Slash command autocomplete hint */}
            {showSlashHint && (
              <div className="ml-4 mt-1 border border-surface0 rounded bg-mantle p-2 max-w-[200px]">
                {allCommands.map((cmd, idx) => (
                  <button
                    key={cmd}
                    className={`block w-full text-left px-2 py-0.5 rounded text-xs ${
                      idx === hintIndex
                        ? 'bg-surface0 text-text'
                        : 'text-subtext1 hover:bg-surface0 hover:text-text'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setInput(cmd)
                      setShowSlashHint(false)
                      setHintIndex(-1)
                      inputRef.current?.focus()
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
