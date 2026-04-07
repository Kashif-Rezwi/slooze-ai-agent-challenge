'use client'

import { useState, useRef, type KeyboardEvent } from 'react'

interface ChatInputProps {
  isLoading: boolean
  onSend: (text: string) => void
}

export default function ChatInput({ isLoading, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Enter, allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    // Auto-grow textarea up to ~5 lines
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div className="flex items-end gap-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask anything… (Shift+Enter for newline)"
        disabled={isLoading}
        className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 leading-relaxed"
        style={{ height: 'auto', minHeight: '24px' }}
      />

      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
        className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-white"
          >
            <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
          </svg>
        )}
      </button>
    </div>
  )
}
