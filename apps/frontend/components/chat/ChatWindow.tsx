'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Mode } from '@slooze/shared'
import type { ChatMessage } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
  onSuggestionClick: (mode: Mode) => void
}

/** Distance from the scroll bottom (px) within which we treat user as "at bottom". */
const AT_BOTTOM_THRESHOLD = 80

const SCROLL_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
}

export default function ChatWindow({ messages, isLoading, onSuggestionClick }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  /**
   * Tracks which message IDs have already been animated.
   * Stored as a ref so it persists across renders without causing re-renders.
   * Updated in a useEffect (not during render) to avoid mutation side-effects.
   */
  const animatedIdsRef = useRef(new Set<string>())

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distanceFromBottom <= AT_BOTTOM_THRESHOLD
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Sync the animated IDs set after each render so new messages animate exactly once.
  useEffect(() => {
    animatedIdsRef.current = new Set(messages.map(m => m.id))
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll} style={SCROLL_MASK}>
        <div className="max-w-3xl mx-auto px-5 h-full">
          <EmptyState onSuggestionClick={onSuggestionClick} />
        </div>
      </div>
    )
  }

  const lastMessage = messages[messages.length - 1]

  const showTypingIndicator = isLoading
    && lastMessage?.role === 'assistant'
    && lastMessage.content === ''

  const streamingMessageId = isLoading && lastMessage?.role === 'assistant'
    ? lastMessage.id
    : null

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll} style={SCROLL_MASK}>
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {messages.map((message) => {
          // Only animate messages that haven't been rendered before.
          // animatedIdsRef is updated after render, so new messages are caught here.
          const isNew = !animatedIdsRef.current.has(message.id)
          return (
            <div key={message.id} className={isNew ? 'animate-fade-in' : ''}>
              <MessageBubble
                message={message}
                isStreaming={message.id === streamingMessageId}
              />
            </div>
          )
        })}

        {showTypingIndicator && (
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)]">
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-1" />
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-2" />
              <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full dot-3" />
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
