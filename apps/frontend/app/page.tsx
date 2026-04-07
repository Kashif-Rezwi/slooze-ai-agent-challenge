'use client'

import { useChat } from '@/hooks/useChat'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'

export default function ChatPage() {
  const { messages, isLoading, sendMessage } = useChat()

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4">
      {/* PDF session banner — wired in Phase 6 */}
      <PdfSessionBanner filename={null} onClear={() => {}} />

      <ChatWindow messages={messages} isLoading={isLoading} />

      <div className="py-4 border-t border-[var(--color-border)]">
        <ChatInput isLoading={isLoading} onSend={sendMessage} />
      </div>
    </div>
  )
}
