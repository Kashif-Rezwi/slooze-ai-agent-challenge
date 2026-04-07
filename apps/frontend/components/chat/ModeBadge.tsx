/**
 * Shows which pipeline answered: 🌐 Web or 📄 PDF.
 * Fully wired in Phase 4 (web) and Phase 6 (PDF).
 */
import type { Mode } from '@slooze/shared'

interface ModeBadgeProps {
  mode: Mode
}

const config: Record<Mode, { icon: string; label: string; className: string }> = {
  web: {
    icon: '🌐',
    label: 'Web',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  pdf: {
    icon: '📄',
    label: 'PDF',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const { icon, label, className } = config[mode]
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${className}`}
    >
      {icon} {label}
    </span>
  )
}
