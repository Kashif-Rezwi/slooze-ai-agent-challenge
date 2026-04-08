'use client'

import type { ReactNode } from 'react'
import { Icons } from '@/components/ui/Icons'

const SUGGESTIONS: { icon: ReactNode; label: string }[] = [
  { icon: <Icons.Globe className="w-4 h-4" />, label: 'Search the web' },
  { icon: <Icons.Document className="w-4 h-4" />, label: 'Chat with a PDF' },
  { icon: <Icons.Bolt className="w-4 h-4" />, label: 'Summarize content' },
]

export default function EmptyState() {
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
          <div
            key={s.label}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] cursor-default select-none animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {s.icon}
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
