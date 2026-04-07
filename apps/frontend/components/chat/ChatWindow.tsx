'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
}

// Quick-action suggestion chips shown on the empty state
const SUGGESTIONS = [
  { icon: '🌐', label: 'Search the web' },
  { icon: '📄', label: 'Chat with a PDF' },
  { icon: '⚡', label: 'Summarize content' },
]

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
      {/* Hero headline */}
      <div className="text-center space-y-3 max-w-md">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #e6edf3 0%, #9f96ff 60%, #6c63ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          What do you want to know?
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
          Search the web in real-time, or upload a PDF and ask questions about it.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] cursor-default select-none animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span>{s.icon}</span>
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


