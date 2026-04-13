import type { ReactNode } from 'react'
import type { Mode } from '@slooze/shared'
import { Icons } from '@/components/ui/Icons'

interface Suggestion {
  icon: ReactNode
  label: string
  mode: Mode
}

const SUGGESTIONS: Suggestion[] = [
  { icon: <Icons.Globe className="w-4 h-4" />,    label: 'Search the web',   mode: 'web' },
  { icon: <Icons.Document className="w-4 h-4" />, label: 'Chat with a PDF',  mode: 'pdf' },
  { icon: <Icons.Bolt className="w-4 h-4" />,     label: 'Summarize content', mode: 'web' },
]

interface EmptyStateProps {
  onSuggestionClick: (mode: Mode) => void
}

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
      <div className="text-center space-y-2.5 max-w-sm">
        <h1
          className="text-[2rem] font-bold tracking-tight leading-tight"
          style={{
            background: `linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-light) 55%, var(--color-accent) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ask anything.
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
          Real-time web search. PDF conversations.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.mode)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer select-none animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
