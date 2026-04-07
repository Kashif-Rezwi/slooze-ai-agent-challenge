'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
}

// ── Suggestion chip icons (inline SVG — no external dep) ─────────────────
function GlobeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}
function DocumentIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

// Suggestion chips shown on empty state
const SUGGESTIONS: { icon: React.ReactNode; label: string }[] = [
  { icon: <GlobeIcon />, label: 'Search the web' },
  { icon: <DocumentIcon />, label: 'Chat with a PDF' },
  { icon: <BoltIcon />, label: 'Summarize content' },
]

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
      {/* Hero headline */}
      <div className="text-center space-y-2.5 max-w-sm">
        <h1
          className="text-[2rem] font-bold tracking-tight leading-tight"
          style={{
            background: `linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-light) 55%, var(--color-accent) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ask anything.
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
          Real-time web search. PDF conversations.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] cursor-default select-none animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {s.icon}
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 py-8 space-y-8">
      {messages.map((message, idx) => (
        <div
          key={message.id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(idx * 30, 150)}ms` }}
        >
          <MessageBubble message={message} />
        </div>
      ))}

      {/* Typing indicator — no avatar, minimal dots pill (matches no-bubble AI style) */}
      {isLoading && (
        <div className="animate-fade-in">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-1" />
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-2" />
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-3" />
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
