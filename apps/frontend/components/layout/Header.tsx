import { Icons } from '@/components/ui/Icons'

export default function Header() {
  return (
    <header
      className="glass shrink-0 h-14 flex items-center sticky top-0 z-20 border-b border-[var(--color-border)]/60"
    >
      <div className="max-w-3xl mx-auto px-5 w-full flex items-center gap-3">
        {/* Logo mark — gradient container with spark SVG */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #9f96ff 100%)' }}
        >
          <Icons.Spark className="w-4 h-4 text-white" />
        </div>

        {/* Wordmark */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-[var(--color-text-primary)] tracking-tight text-[15px]">
            Slooze
          </span>
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ color: 'var(--color-accent-light)' }}
          >
            AI
          </span>
        </div>
      </div>
    </header>
  )
}
