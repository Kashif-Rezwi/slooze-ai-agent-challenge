'use client'

import { useChat } from '@/hooks/useChat'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'

export default function ChatPage() {
  const { messages, isLoading, sendMessage } = useChat()

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">

      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          {/* Logo mark — gradient circle */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #9f96ff 100%)' }}
          >
            S
          </div>
          <span className="font-semibold text-[var(--color-text-primary)] tracking-tight">
            Slooze AI
          </span>
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 ml-1">
            Beta
          </span>
        </div>
      </header>

      {/* ── Scrollable Message Area ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 h-full">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Pinned Composer Zone ───────────────────────────────────────── */}
      <div className="shrink-0 sticky bottom-0 z-10">
        {/* Fade gradient so messages don't hard-clip into the composer */}
        <div
          className="h-8 w-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--color-surface))',
          }}
        />
        <div className="bg-[var(--color-surface)] pb-6 px-4">
          <div className="max-w-3xl mx-auto space-y-2">
            <PdfSessionBanner filename={null} onClear={() => {}} />
            <ChatInput isLoading={isLoading} onSend={sendMessage} />
            <p className="text-center text-[11px] text-[var(--color-text-subtle)]">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

