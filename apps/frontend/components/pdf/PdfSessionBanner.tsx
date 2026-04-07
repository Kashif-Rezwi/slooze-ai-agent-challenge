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
    <div className="flex items-center justify-between gap-3 px-4 py-2 my-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
      <span className="flex items-center gap-2 text-amber-400 truncate">
        <span>📄</span>
        <span className="truncate">Talking to: {filename}</span>
      </span>
      <button
        onClick={onClear}
        aria-label="Clear PDF session"
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
