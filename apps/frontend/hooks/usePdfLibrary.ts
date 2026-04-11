'use client'

import { useState } from 'react'
import type { Mode } from '@slooze/shared'
import { uploadPdf } from '@/lib/api'
import type { PdfSession } from '@/lib/types'

interface UsePdfLibraryReturn {
  library: PdfSession[]
  /** Set of selected document IDs — multiple can be active at once. */
  activePdfIds: string[]
  isUploading: boolean
  uploadError: string | null
  onPdfSelect: (files: File[]) => Promise<void>
  /** Toggle a document's selection on/off. */
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  /** Call when switching to PDF mode — auto-selects the most recent doc if none are selected. */
  onSwitchToPdf: () => void
  /** Returns selected IDs in PDF mode, empty array in web mode. */
  effectiveDocumentIds: (mode: Mode) => string[]
}

export function usePdfLibrary(): UsePdfLibraryReturn {
  const [library, setLibrary] = useState<PdfSession[]>([])
  const [activePdfIds, setActivePdfIds] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function onPdfSelect(files: File[]) {
    setUploadError(null)
    setIsUploading(true)
    try {
      // Upload all selected files concurrently; collect successes and failures separately.
      const results = await Promise.allSettled(files.map(f => uploadPdf(f)))

      const uploaded: PdfSession[] = []
      const errors: string[] = []

      for (const result of results) {
        if (result.status === 'fulfilled') {
          uploaded.push(result.value)
        } else {
          errors.push(result.reason instanceof Error ? result.reason.message : 'Upload failed')
        }
      }

      if (uploaded.length > 0) {
        setLibrary(prev => [...prev, ...uploaded])
        // Auto-select all newly uploaded documents.
        setActivePdfIds(prev => [...prev, ...uploaded.map(u => u.documentId)])
      }

      if (errors.length > 0) {
        setUploadError(errors.length === 1 ? errors[0] : `${errors.length} files failed to upload`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  function onToggle(id: string) {
    setActivePdfIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function onRemove(id: string) {
    setLibrary(prev => prev.filter(p => p.documentId !== id))
    setActivePdfIds(prev => prev.filter(x => x !== id))
    setUploadError(null)
  }

  function onSwitchToPdf() {
    // If no docs are selected but the library has docs, auto-select the most recent one.
    setActivePdfIds(prev => {
      if (prev.length > 0) return prev
      if (library.length > 0) return [library[library.length - 1].documentId]
      return prev
    })
  }

  function effectiveDocumentIds(mode: Mode): string[] {
    return mode === 'pdf' ? activePdfIds : []
  }

  return { library, activePdfIds, isUploading, uploadError, onPdfSelect, onToggle, onRemove, onSwitchToPdf, effectiveDocumentIds }
}
