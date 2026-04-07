/**
 * Shows "Talking to: <filename>" when a PDF is loaded.
 * Fully wired in Phase 6 (PDF upload + documentId state).
 * Receives null for filename when no PDF is active — renders nothing.
 */
interface PdfSessionBannerProps {
  filename: string | null
  onClear: () => void
}

export default function PdfSessionBanner({ filename, onClear }: PdfSessionBannerProps) {
  if (!filename) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 border-l-2 border-l-amber-500 text-sm animate-slide-down">
      <span className="flex items-center gap-2 text-amber-400 truncate min-w-0">
        {/* Document icon */}
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
        <span className="truncate font-medium">Talking to: {filename}</span>
      </span>

      <button
        onClick={onClear}
        aria-label="Clear PDF session"
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/8 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

