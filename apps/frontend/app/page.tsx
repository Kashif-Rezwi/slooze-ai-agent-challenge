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
      {/* Brand stays fully left-pinned; content area below is centred separately */}
      <header
        className="shrink-0 h-14 flex items-center sticky top-0 z-20 border-b border-[var(--color-border)]/60"
        style={{
          background: 'rgba(13, 17, 23, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-3xl mx-auto px-5 w-full flex items-center gap-2.5">
          {/* Logo mark — gradient square */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #9f96ff 100%)' }}
          >
            S
          </div>
          <span className="font-semibold text-[var(--color-text-primary)] tracking-tight">
            Slooze AI
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-widest uppercase ml-1"
            style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(159,150,255,0.12) 100%)',
              border: '1px solid rgba(108,99,255,0.25)',
              color: '#9f96ff',
            }}
          >
            Beta
          </span>
        </div>
      </header>

      {/* ── Scrollable Message Area ────────────────────────────────────── */}
      {/* CSS mask-image creates clean top+bottom fade without extra DOM nodes */}
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

      {/* ── Pinned Composer Zone ───────────────────────────────────────── */}
      <div
        className="shrink-0 sticky bottom-0 z-10 pb-6 px-5"
        style={{
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
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


