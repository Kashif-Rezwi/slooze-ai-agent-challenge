'use client'

import { useState } from 'react'
import type { Mode } from '@slooze/shared'
import { useChat } from '@/hooks/useChat'
import { uploadPdf } from '@/lib/api'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import PdfSessionBanner from '@/components/pdf/PdfSessionBanner'
import Header from '@/components/layout/Header'

export interface PdfSession {
  documentId: string
  filename: string
}

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage } = useChat()

  // Global mode — drives which pipeline the backend uses and which UI controls are visible.
  const [mode, setMode] = useState<Mode>('web')

  // Multi-PDF library: all uploads live here for the session regardless of mode.
  // activePdfId points to whichever doc is currently selected in PDF mode.
  const [pdfLibrary, setPdfLibrary] = useState<PdfSession[]>([])
  const [activePdfId, setActivePdfId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    // Switching to PDF with uploads but no active selection → restore the last uploaded doc
    if (newMode === 'pdf' && pdfLibrary.length > 0 && activePdfId === null) {
      setActivePdfId(pdfLibrary[pdfLibrary.length - 1].documentId)
    }
  }

  async function handlePdfSelect(file: File) {
    setUploadError(null)
    setIsUploading(true)
    try {
      const { documentId, filename } = await uploadPdf(file)
      setPdfLibrary(prev => [...prev, { documentId, filename }])
      setActivePdfId(documentId)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function handleActivatePdf(id: string) {
    setActivePdfId(id)
  }

  function handleRemovePdf(id: string) {
    setPdfLibrary(prev => {
      const next = prev.filter(p => p.documentId !== id)
      // If the removed doc was active, auto-activate the most recently uploaded remaining one.
      if (activePdfId === id) {
        setActivePdfId(next.length > 0 ? next[next.length - 1].documentId : null)
      }
      return next
    })
    setUploadError(null)
  }

  // In web mode we never send a documentId — uploads are preserved but paused.
  const effectiveDocumentId = mode === 'pdf' ? activePdfId : null

  const activeError = uploadError ?? error

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">

      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <Header />

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {activeError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center py-1.5 px-4 animate-slide-down">
          {activeError}
        </div>
      )}

      {/* ── Scrollable Message Area ─────────────────────────────────── */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* ── Pinned Composer Zone ────────────────────────────────────── */}
      <div className="glass shrink-0 sticky bottom-0 z-10 pb-6 px-5">
        <div className="max-w-3xl mx-auto space-y-2">
          <PdfSessionBanner
            library={pdfLibrary}
            activePdfId={activePdfId}
            isPaused={mode === 'web'}
            onActivate={handleActivatePdf}
            onRemove={handleRemovePdf}
          />
          <ChatInput
            isLoading={isLoading}
            isUploading={isUploading}
            mode={mode}
            onModeChange={handleModeChange}
            onSend={(text) => sendMessage(text, effectiveDocumentId)}
            // Only pass the upload handler in PDF mode — this also disables drag-drop in web mode.
            onPdfSelect={mode === 'pdf' ? handlePdfSelect : undefined}
          />
        </div>
      </div>

    </div>
  )
}
