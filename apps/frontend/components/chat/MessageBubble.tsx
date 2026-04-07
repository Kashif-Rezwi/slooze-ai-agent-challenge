import type { ChatMessage } from '@/hooks/useChat'
import ModeBadge from './ModeBadge'
import SourceChips from './SourceChips'
import MarkdownContent from './MarkdownContent'

interface MessageBubbleProps {
  message: ChatMessage
  /** Pass true on the last AI message to enable the streaming cursor */
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  /* ── User message ─────────────────────────────────────────────────── */
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed text-white whitespace-pre-wrap"
          style={{
            background: 'linear-gradient(135deg, #6c63ff 0%, #7c72ff 100%)',
            boxShadow: '0 1px 4px rgba(108, 99, 255, 0.3)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  /* ── AI message ───────────────────────────────────────────────────── */
  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar — gradient badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #9f96ff 100%)' }}
      >
        S
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Bubble */}
        <div
          className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[var(--color-ai-bubble)] border border-[var(--color-border)]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          <MarkdownContent content={message.content} isStreaming={isStreaming} />
        </div>

        {/* Mode badge + sources — below the bubble */}
        <div className="flex flex-col gap-2 pl-0.5">
          {message.mode && <ModeBadge mode={message.mode} />}
          {message.sources && message.sources.length > 0 && (
            <SourceChips sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  )
}

