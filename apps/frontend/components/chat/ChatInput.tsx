'use client'

import { useState, useRef, type KeyboardEvent, type DragEvent } from 'react'
import type { Mode } from '@slooze/shared'
import { Icons } from '@/components/ui/Icons'

interface ChatInputProps {
  isLoading: boolean
  isUploading?: boolean
  mode: Mode
  onModeChange: (mode: Mode) => void
  onSend: (text: string) => void
  /** Undefined in web mode — also disables drag-drop automatically. */
  onPdfSelect?: (file: File) => void
}

export default function ChatInput({
  isLoading,
  isUploading = false,
  mode,
  onModeChange,
  onSend,
  onPdfSelect,
}: ChatInputProps) {
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

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  // Drag-drop is only active when onPdfSelect is provided (i.e. PDF mode).
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (!onPdfSelect) return
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
  const isPdfMode = mode === 'pdf'

  const placeholder = isDragging
    ? 'Drop PDF here…'
    : isPdfMode
      ? 'Ask about your PDF…'
      : 'Search the web…'

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
      {/* ── TOP: Textarea ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          autoFocus
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full bg-transparent resize-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] disabled:opacity-50 leading-relaxed"
          style={{ minHeight: '24px', maxHeight: '160px' }}
        />
      </div>

      {/* ── BOTTOM: Toolbar row ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pb-3 gap-2">

        {/* Left — Mode toggle + PDF attach (PDF mode only) */}
        <div className="flex items-center gap-2">

          {/* Segmented mode control */}
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5 bg-[var(--color-surface-3)]"
            role="group"
            aria-label="Select mode"
          >
            <button
              onClick={() => onModeChange('web')}
              aria-pressed={mode === 'web'}
              title="Web search mode"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                mode === 'web'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]'
              }`}
            >
              <Icons.Globe className="w-3 h-3 shrink-0" />
              Web
            </button>

            <button
              onClick={() => onModeChange('pdf')}
              aria-pressed={mode === 'pdf'}
              title="PDF Q&A mode"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                mode === 'pdf'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]'
              }`}
            >
              <Icons.Document className="w-3 h-3 shrink-0" />
              PDF
            </button>
          </div>

          {/* Paperclip — rendered only in PDF mode */}
          {isPdfMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                title={isUploading ? 'Uploading PDF…' : 'Upload PDF'}
                aria-label={isUploading ? 'Uploading PDF…' : 'Upload PDF'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading
                  ? <span className="w-3.5 h-3.5 border-2 border-[var(--color-text-muted)]/30 border-t-[var(--color-text-muted)] rounded-full animate-spin" />
                  : <Icons.Paperclip className="w-3.5 h-3.5" />
                }
              </button>
            </>
          )}
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
          {isLoading
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icons.ArrowUp className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )
}
