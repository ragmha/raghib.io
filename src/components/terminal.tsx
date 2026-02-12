'use client'

import { useState, useEffect, useCallback } from 'react'

const STREAMING_TEXT = 'Hi, I am Raghib nice to meet you..'
const CHAR_DELAY = 50
const PAUSE_AFTER_STREAM = 2000
const FADE_DURATION = 400

interface ToolConfig {
  name: string
  prompt: string
  accentColor: string
  banner: string[]
}

const tools: ToolConfig[] = [
  {
    name: 'GitHub Copilot CLI',
    prompt: '> ',
    accentColor: 'text-green',
    banner: [
      '╔══════════════════════════════════════════╗',
      '║   ____ ___ _     ___ _____              ║',
      '║  |  _ \\_ _| |   / _ \\_   _|             ║',
      '║  | |_) | || |  | | | || |               ║',
      '║  |  __/| || |__| |_| || |               ║',
      '║  |_|  |___|_____\\___/ |_|               ║',
      '║                                          ║',
      '║  GitHub Copilot CLI v1.0.0               ║',
      '║  ✓ Logged in as raghibhasan              ║',
      '║  ✓ Connected to GitHub MCP Server        ║',
      '╚══════════════════════════════════════════╝',
    ],
  },
  {
    name: 'Claude Code',
    prompt: '❯ ',
    accentColor: 'text-peach',
    banner: [
      '╔══════════════════════════════════════════╗',
      '║                                          ║',
      '║    ██████╗██╗      █████╗ ██╗   ██╗      ║',
      '║   ██╔════╝██║     ██╔══██╗██║   ██║      ║',
      '║   ██║     ██║     ███████║██║   ██║      ║',
      '║   ██║     ██║     ██╔══██║██║   ██║      ║',
      '║   ╚██████╗███████╗██║  ██║╚██████╔╝      ║',
      '║    ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝       ║',
      '║                                          ║',
      '║   Claude Code — Anthropic                ║',
      '║   Model: claude-sonnet-4   Plan: Max  ║',
      '╚══════════════════════════════════════════╝',
    ],
  },
  {
    name: 'Codex CLI',
    prompt: '> ',
    accentColor: 'text-green',
    banner: [
      '╔══════════════════════════════════════════╗',
      '║                                          ║',
      '║    ██████╗ ██████╗ ██████╗ ███████╗      ║',
      '║   ██╔════╝██╔═══██╗██╔══██╗██╔════╝      ║',
      '║   ██║     ██║   ██║██║  ██║█████╗        ║',
      '║   ██║     ██║   ██║██║  ██║██╔══╝        ║',
      '║   ╚██████╗╚██████╔╝██████╔╝███████╗      ║',
      '║    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝      ║',
      '║                                          ║',
      '║   Codex CLI — OpenAI                     ║',
      '║   Model: gpt-5.3-codex                   ║',
      '╚══════════════════════════════════════════╝',
    ],
  },
  {
    name: 'OpenCode',
    prompt: '> ',
    accentColor: 'text-blue',
    banner: [
      '╔══════════════════════════════════════════╗',
      '║                                          ║',
      '║    ██████╗ ██████╗ ███████╗███╗   ██╗    ║',
      '║   ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ║',
      '║   ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ║',
      '║   ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ║',
      '║   ╚██████╔╝██║     ███████╗██║ ╚████║    ║',
      '║    ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ║',
      '║                                          ║',
      '║   OpenCode — by SST                      ║',
      '║   Model: claude-sonnet-4                ║',
      '╚══════════════════════════════════════════╝',
    ],
  },
]

export function Terminal() {
  const [currentTool, setCurrentTool] = useState(0)
  const [streamedText, setStreamedText] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530)
    return () => clearInterval(interval)
  }, [])

  const streamText = useCallback(() => {
    let i = 0
    setStreamedText('')
    const interval = setInterval(() => {
      if (i < STREAMING_TEXT.length) {
        setStreamedText(STREAMING_TEXT.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        // Pause then transition
        setTimeout(() => {
          setIsTransitioning(true)
          setTimeout(() => {
            setCurrentTool((prev) => (prev + 1) % tools.length)
            setStreamedText('')
            setIsTransitioning(false)
          }, FADE_DURATION)
        }, PAUSE_AFTER_STREAM)
      }
    }, CHAR_DELAY)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cleanup = streamText()
    return cleanup
  }, [currentTool, streamText])

  const tool = tools[currentTool]

  return (
    <div
      className="rounded-lg border border-surface0 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
      }}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-mantle border-b border-surface0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink" />
          <span className="w-3 h-3 rounded-full bg-yellow" />
          <span className="w-3 h-3 rounded-full bg-green" />
        </div>
        <span className="text-sm text-overlay1 font-mono">{tool.name}</span>
        <div className="w-[52px]" />
      </div>

      {/* Terminal body */}
      <div className="p-5 bg-base font-mono text-sm leading-relaxed min-h-[360px]">
        {/* ASCII Banner */}
        <div className={`${tool.accentColor} text-xs leading-none mb-4`}>
          {tool.banner.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line}
            </div>
          ))}
        </div>

        {/* Prompt + streaming text */}
        <div className="flex items-start mt-4">
          <span className={`${tool.accentColor} font-bold shrink-0`}>
            {tool.prompt}
          </span>
          <span className="text-text">
            {streamedText}
            <span
              className={`${tool.accentColor} ${showCursor ? 'opacity-100' : 'opacity-0'}`}
            >
              █
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
