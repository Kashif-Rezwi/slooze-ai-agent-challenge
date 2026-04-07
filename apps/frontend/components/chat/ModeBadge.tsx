/**
 * Shows which pipeline answered: Web Search or PDF Q&A.
 * Minimal annotation style — coloured dot + muted label.
 * Fully wired in Phase 4 (web) and Phase 6 (PDF).
 */
import type { Mode } from '@slooze/shared'

interface ModeBadgeProps {
  mode: Mode
}

const config: Record<Mode, { dotColor: string; label: string; textColor: string }> = {
  web: {
    dotColor: '#3b82f6',   // blue-500
    label: 'Web Search',
    textColor: '#6b7280',  // neutral muted
  },
  pdf: {
    dotColor: '#f59e0b',   // amber-500
    label: 'PDF Q&A',
    textColor: '#6b7280',
  },
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const { dotColor, label, textColor } = config[mode]
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: textColor }}>
      {/* Coloured status dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </span>
  )
}


