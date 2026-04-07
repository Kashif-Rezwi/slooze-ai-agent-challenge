/**
 * Renders source URLs as small clickable chips below an AI message.
 * Fully wired in Phase 4 (web URLs) and Phase 6 (PDF page references).
 */
interface SourceChipsProps {
  sources: string[]
}

export default function SourceChips({ sources }: SourceChipsProps) {
  if (sources.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {sources.map((src, i) => (
        <a
          key={i}
          href={src.startsWith('http') ? src : undefined}
          target="_blank"
          rel="noopener noreferrer"
          title={src}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors max-w-[200px] truncate"
        >
          <span className="truncate">
            {src.startsWith('http') ? new URL(src).hostname : src}
          </span>
        </a>
      ))}
    </div>
  )
}
