'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Slooze AI
        </p>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
          Ask anything. Upload a PDF to chat with a document.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-6 space-y-4">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing indicator while waiting for the first token */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs shrink-0">
            AI
          </div>
          <div className="bg-[var(--color-ai-bubble)] border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-4 py-3">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
