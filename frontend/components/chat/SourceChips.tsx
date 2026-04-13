import { Icons } from '@/components/ui/Icons'

interface SourceChipsProps {
  sources: string[]
}

function getHostname(src: string): string {
  try {
    return src.startsWith('http') ? new URL(src).hostname.replace('www.', '') : src
  } catch {
    return src
  }
}

function getFaviconUrl(src: string): string | null {
  try {
    const { origin } = new URL(src)
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=16`
  } catch {
    return null
  }
}

export default function SourceChips({ sources }: SourceChipsProps) {
  if (sources.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-[var(--color-text-subtle)] uppercase tracking-wider px-0.5">
        Sources
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sources.map((src) => {
          const hostname = getHostname(src)
          const favicon = getFaviconUrl(src)
          const isUrl = src.startsWith('http')

          return (
            <a
              key={src}
              href={isUrl ? src : undefined}
              target="_blank"
              rel="noopener noreferrer"
              title={src}
              className="flex-none flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-2)] transition-colors group"
            >
              {favicon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={favicon}
                  alt=""
                  width={12}
                  height={12}
                  className="w-3 h-3 rounded-sm shrink-0 opacity-70 group-hover:opacity-100"
                />
              ) : (
                <Icons.DocFilled className="w-3 h-3 shrink-0 text-[var(--color-text-subtle)]" />
              )}
              <span className="text-[11px] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] font-medium transition-colors truncate max-w-[120px]">
                {hostname}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
