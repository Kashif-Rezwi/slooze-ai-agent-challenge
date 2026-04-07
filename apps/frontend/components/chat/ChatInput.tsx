'use client'

import { useState, useRef, type KeyboardEvent, type DragEvent } from 'react'

interface ChatInputProps {
  isLoading: boolean
  onSend: (text: string) => void
  /** Phase 6 — called when the user picks a PDF file. Stub for now. */
  onPdfSelect?: (file: File) => void
}

export default function ChatInput({ isLoading, onSend, onPdfSelect }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  // Drag-and-drop on the composer card
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }
  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf' && onPdfSelect) {
      onPdfSelect(file)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && onPdfSelect) {
      onPdfSelect(file)
    }
    e.target.value = '' // reset so same file can be re-selected
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-[var(--color-surface-2)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]/30 focus-within:border-[var(--color-accent)]/50 ${
        isDragging
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
          : 'border-[var(--color-border)]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── TOP: Textarea ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isDragging ? 'Drop PDF here…' : 'Ask anything, or upload a PDF…'}
          disabled={isLoading}
          className="w-full bg-transparent resize-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] disabled:opacity-50 leading-relaxed"
          style={{ minHeight: '24px', maxHeight: '160px' }}
        />
      </div>

      {/* ── BOTTOM: Toolbar row ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pb-3">

        {/* Left — Attach PDF */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Upload PDF"
            aria-label="Upload PDF"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {/* Paperclip icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <span className="text-[11px] text-[var(--color-text-subtle)] hidden sm:block">
            PDF supported · Shift+Enter for newline
          </span>
        </div>

        {/* Right — Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium shrink-0 transition-all duration-150 ${
            canSend
              ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-sm'
              : 'bg-[var(--color-surface-3)] text-[var(--color-text-subtle)] cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            /* Spinner */
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            /* Arrow-up icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

