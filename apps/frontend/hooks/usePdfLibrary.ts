'use client'

import { useState } from 'react'
import type { Mode } from '@slooze/shared'
import { uploadPdf } from '@/lib/api'
import type { PdfSession } from '@/lib/types'

interface UsePdfLibraryReturn {
  library: PdfSession[]
  activePdfId: string | null
  isUploading: boolean
  uploadError: string | null
  onPdfSelect: (file: File) => Promise<void>
  onActivate: (id: string) => void
  onRemove: (id: string) => void
  /** Call when switching to PDF mode — auto-activates the most recent doc if none is active. */
  onSwitchToPdf: () => void
  /** Returns the active documentId in PDF mode, null otherwise. */
  effectiveDocumentId: (mode: Mode) => string | null
}

export function usePdfLibrary(): UsePdfLibraryReturn {
  const [library, setLibrary] = useState<PdfSession[]>([])
  const [activePdfId, setActivePdfId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function onPdfSelect(file: File) {
    setUploadError(null)
    setIsUploading(true)
    try {
      const { documentId, filename } = await uploadPdf(file)
      setLibrary(prev => [...prev, { documentId, filename }])
      setActivePdfId(documentId)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function onActivate(id: string) {
    setActivePdfId(id)
  }

  function onRemove(id: string) {
    setLibrary(prev => {
      const next = prev.filter(p => p.documentId !== id)
      if (activePdfId === id) {
        setActivePdfId(next.length > 0 ? next[next.length - 1].documentId : null)
      }
      return next
    })
    setUploadError(null)
  }

  function onSwitchToPdf() {
    if (library.length > 0 && activePdfId === null) {
      setActivePdfId(library[library.length - 1].documentId)
    }
  }

  function effectiveDocumentId(mode: Mode): string | null {
    return mode === 'pdf' ? activePdfId : null
  }

  return { library, activePdfId, isUploading, uploadError, onPdfSelect, onActivate, onRemove, onSwitchToPdf, effectiveDocumentId }
}
