import type { Mode } from '@slooze/shared'

interface ModeBadgeProps {
  mode: Mode
}

const config: Record<Mode, { dotClass: string; label: string }> = {
  web: { dotClass: 'bg-blue-500',  label: 'Web Search' },
  pdf: { dotClass: 'bg-amber-500', label: 'PDF Q&A' },
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const { dotClass, label } = config[mode]
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </span>
  )
}
