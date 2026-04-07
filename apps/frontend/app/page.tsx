'use client'

import { useChat } from '@/hooks/useChat'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'
import Header from '@/components/layout/Header'

/** Shared glass-morphism style applied to the composer zone. */
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
      <Header />

      {/* ── Error Banner (request failures) ────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center py-1.5 px-4 animate-slide-down">
          {error}
        </div>
      )}

      {/* ── Scrollable Message Area ─────────────────────────────────── */}
      {/* ChatWindow owns its own scroll container, overflow, and mask-image */}
      <ChatWindow messages={messages} isLoading={isLoading} />


      {/* ── Pinned Composer Zone ────────────────────────────────────── */}
      <div className="shrink-0 sticky bottom-0 z-10 pb-6 px-5" style={GLASS_STYLE}>
        <div className="max-w-3xl mx-auto space-y-2">
          <PdfSessionBanner filename={null} onClear={() => { }} />
          <ChatInput isLoading={isLoading} onSend={sendMessage} />
        </div>
      </div>

    </div>
  )
}
