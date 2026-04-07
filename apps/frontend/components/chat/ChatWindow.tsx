'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ChatMessage } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
}


/** Distance from the scroll bottom (px) within which we treat user as "at bottom" */
const AT_BOTTOM_THRESHOLD = 80

// Shared scroll container style (mask-image fade at top + bottom edges)
const SCROLL_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  /** The scroll container — ChatWindow owns it so it can track scroll position */
  const scrollRef = useRef<HTMLDivElement>(null)
  /** Sentinel element scrolled into view when auto-scroll fires */
  const bottomRef = useRef<HTMLDivElement>(null)
  /**
   * Whether the user is near the bottom of the scroll area.
   * Stored as a ref (not state) to avoid triggering re-renders on every scroll event.
   */
  const isAtBottomRef = useRef(true)

  /** Keep isAtBottomRef in sync whenever the user scrolls */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distanceFromBottom <= AT_BOTTOM_THRESHOLD
  }, [])

  /**
   * Auto-scroll to the bottom when messages change or loading starts/stops,
   * but ONLY if the user was already at the bottom (isAtBottomRef.current === true).
   * This prevents jitter when the user has manually scrolled up.
   */
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Empty state — same scroll container wrapper for layout consistency
  if (messages.length === 0 && !isLoading) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll} style={SCROLL_MASK}>
        <div className="max-w-3xl mx-auto px-5 h-full">
          <EmptyState />
        </div>
      </div>
    )
  }

  const lastMessage = messages[messages.length - 1]

  // Show the three-dot indicator only while the assistant placeholder has no content yet
  const showTypingIndicator = isLoading
    && lastMessage?.role === 'assistant'
    && lastMessage.content === ''

  // Once tokens start arriving, mark that message as streaming so MessageBubble
  // suppresses its sources/mode badge until the stream is complete.
  // NOTE: also covers the pre-text phase (content === '') so sources never
  // flash before the dots indicator while the meta event has already arrived.
  const streamingMessageId = isLoading && lastMessage?.role === 'assistant'
    ? lastMessage.id
    : null

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll} style={SCROLL_MASK}>
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(idx * 30, 150)}ms` }}
          >
            <MessageBubble
              message={message}
              isStreaming={message.id === streamingMessageId}
            />
          </div>
        ))}

        {/* Three-dot indicator — only visible before the first token arrives */}
        {showTypingIndicator && (
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
    </div>
  )
}
