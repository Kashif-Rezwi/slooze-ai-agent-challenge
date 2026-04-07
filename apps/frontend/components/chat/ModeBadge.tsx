/**
 * Shows which pipeline answered: 🌐 Web or 📄 PDF.
 * Fully wired in Phase 4 (web) and Phase 6 (PDF).
 */
import type { Mode } from '@slooze/shared'

interface ModeBadgeProps {
  mode: Mode
}

function GlobeIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    </svg>
  )
}

const config: Record<Mode, { icon: React.ReactNode; label: string; className: string }> = {
  web: {
    icon: <GlobeIcon />,
    label: 'Web Search',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  pdf: {
    icon: <DocumentIcon />,
    label: 'PDF Q&A',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const { icon, label, className } = config[mode]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}

