'use client'

import { useState } from 'react'
import type { Mode } from '@slooze/shared'
import { useChat } from '@/hooks/useChat'
import { usePdfLibrary } from '@/hooks/usePdfLibrary'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'
import Header from '@/components/layout/Header'

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage } = useChat()
  const pdf = usePdfLibrary()
  const [mode, setMode] = useState<Mode>('web')

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    if (newMode === 'pdf') pdf.onSwitchToPdf()
  }

  const activeError = pdf.uploadError ?? error

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">

      <Header />

      {activeError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center py-1.5 px-4 animate-slide-down">
          {activeError}
        </div>
      )}

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSuggestionClick={handleModeChange}
      />

      <div className="glass shrink-0 sticky bottom-0 z-10 pb-6 px-5">
        <div className="max-w-3xl mx-auto space-y-2">
          <PdfSessionBanner
            library={pdf.library}
            activePdfIds={pdf.activePdfIds}
            isPaused={mode === 'web'}
            onToggle={pdf.onToggle}
            onRemove={pdf.onRemove}
          />
          <ChatInput
            isLoading={isLoading}
            isUploading={pdf.isUploading}
            mode={mode}
            onModeChange={handleModeChange}
            onSend={(text) => sendMessage(text, pdf.effectiveDocumentIds(mode))}
            onPdfSelect={mode === 'pdf' ? pdf.onPdfSelect : undefined}
          />
        </div>
      </div>

    </div>
  )
}
