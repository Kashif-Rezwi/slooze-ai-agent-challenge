import type { PdfSession } from '@/lib/types'
import { Icons } from '@/components/ui/Icons'

interface PdfSessionBannerProps {
  library: PdfSession[]
  activePdfIds: string[]
  /** True when web mode is active — hides the banner with an animation. */
  isPaused: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export default function PdfSessionBanner({
  library,
  activePdfIds,
  isPaused,
  onToggle,
  onRemove,
}: PdfSessionBannerProps) {
  if (library.length === 0) return null

  return (
    <div
      className={`
        -mx-[2px]
        overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[max-height,opacity,transform]
        ${isPaused
          ? 'max-h-0 opacity-0 scale-95 pointer-events-none'
          : 'max-h-16 opacity-100 scale-100'
        }
      `}
      aria-hidden={isPaused}
    >
      <div
        className="flex items-center gap-2 overflow-x-auto py-1 px-[4px] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 6px, black calc(100% - 6px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 6px, black calc(100% - 6px), transparent)',
          scrollbarWidth: 'none'
        }}
        role="group"
        aria-label="Uploaded PDF documents"
      >
        {library.map((pdf) => {
          const isActive = activePdfIds.includes(pdf.documentId)

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
              {/* Toggle button — clicking selects/deselects the document */}
              <button
                onClick={() => onToggle(pdf.documentId)}
                title={isActive ? `Deselect: ${pdf.filename}` : `Select: ${pdf.filename}`}
                aria-label={isActive ? `Deselect document: ${pdf.filename}` : `Select document: ${pdf.filename}`}
                aria-pressed={isActive}
                className="flex items-center gap-1.5 min-w-0"
              >
                {isActive
                  ? <Icons.Check className="w-3 h-3 shrink-0" />
                  : <Icons.DocFilled className="w-3 h-3 shrink-0" />
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
