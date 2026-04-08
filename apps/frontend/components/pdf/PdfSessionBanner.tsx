import React from 'react'
import type { PdfSession } from '@/app/page'

interface PdfSessionBannerProps {
  library: PdfSession[]
  activePdfId: string | null
  /** True when web mode is active — hides the banner completely with an animation */
  isPaused: boolean
  onActivate: (id: string) => void
  onRemove: (id: string) => void
}

function DocIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    </svg>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

/**
 * Renders a horizontal scrollable row of PDF pills — one per uploaded document.
 * Includes a smooth scale & collapse animation when hiding/showing (e.g. mode changes).
 * Returns null when the library is empty.
 */
export default function PdfSessionBanner({
  library,
  activePdfId,
  isPaused,
  onActivate,
  onRemove,
}: PdfSessionBannerProps) {
  if (library.length === 0) return null

  return (
    <div
      className={`
        overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[max-height,opacity,transform]
        ${isPaused
          ? 'max-h-0 opacity-0 scale-95 pointer-events-none'
          : 'max-h-16 opacity-100 scale-100'
        }
      `}
      aria-hidden={isPaused}
    >
      <div
        className="flex items-center gap-2 overflow-x-auto py-1"
        role="group"
        aria-label="Uploaded PDF documents"
      >
        {library.map((pdf) => {
          const isActive = pdf.documentId === activePdfId

          return (
            <div
              key={pdf.documentId}
              className={`
                flex-none flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg border
                text-xs font-medium transition-all duration-150
                ${isActive
                  ? 'bg-amber-500/12 border-amber-500/40 text-amber-400'
                  : 'bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] cursor-pointer'
                }
              `}
            >
              {/* Activate button */}
              <button
                onClick={() => !isActive && onActivate(pdf.documentId)}
                disabled={isActive}
                title={isActive ? `Active: ${pdf.filename}` : `Switch to: ${pdf.filename}`}
                aria-label={isActive ? `Active document: ${pdf.filename}` : `Switch to ${pdf.filename}`}
                className="flex items-center gap-1.5 min-w-0 disabled:cursor-default"
              >
                {isActive
                  ? <CheckIcon className="w-3 h-3 shrink-0" />
                  : <DocIcon className="w-3 h-3 shrink-0" />
                }
                <span className="truncate max-w-[140px]">{pdf.filename}</span>
              </button>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(pdf.documentId) }}
                aria-label={`Remove ${pdf.filename}`}
                title={`Remove ${pdf.filename}`}
                className={`
                  shrink-0 w-4 h-4 rounded flex items-center justify-center transition-colors
                  ${isActive
                    ? 'hover:bg-amber-500/20 text-amber-500/60 hover:text-amber-400'
                    : 'hover:bg-white/10 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
