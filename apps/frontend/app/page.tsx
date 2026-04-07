'use client'

import { useChat } from '@/hooks/useChat'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'

/** Shared glass-morphism style applied to the header and composer zone. */
const GLASS_STYLE: React.CSSProperties = {
  background: 'rgba(13, 17, 23, 0.80)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage } = useChat()

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">

      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <header
        className="shrink-0 h-14 flex items-center sticky top-0 z-20 border-b border-[var(--color-border)]/60"
        style={GLASS_STYLE}
      >
        <div className="max-w-3xl mx-auto px-5 w-full flex items-center gap-3">
          {/* Logo mark — gradient container with spark SVG */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #9f96ff 100%)' }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          {/* Wordmark */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-[var(--color-text-primary)] tracking-tight text-[15px]">
              Slooze
            </span>
            <span
              className="font-semibold text-[15px] tracking-tight"
              style={{ color: 'var(--color-accent-light)' }}
            >
              AI
            </span>
          </div>

          {/* Beta pill */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-widest uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(159,150,255,0.12) 100%)',
              border: '1px solid rgba(108,99,255,0.25)',
              color: 'var(--color-accent-light)',
            }}
          >
            Beta
          </span>
        </div>
      </header>

      {/* ── Error Banner (request failures) ────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center py-1.5 px-4 animate-slide-down">
          {error}
        </div>
      )}

      {/* ── Scrollable Message Area ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-5 h-full">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Pinned Composer Zone ────────────────────────────────────── */}
      <div className="shrink-0 sticky bottom-0 z-10 pb-6 px-5" style={GLASS_STYLE}>
        <div className="max-w-3xl mx-auto space-y-2">
          <PdfSessionBanner filename={null} onClear={() => {}} />
          <ChatInput isLoading={isLoading} onSend={sendMessage} />
          <p className="text-center text-[11px] text-[var(--color-text-subtle)]">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

    </div>
  )
}
