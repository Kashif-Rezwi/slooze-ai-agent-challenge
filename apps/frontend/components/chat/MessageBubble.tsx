import type { ChatMessage } from '@/hooks/useChat'
import ModeBadge from './ModeBadge'
import SourceChips from './SourceChips'
import MarkdownContent from './MarkdownContent'

interface MessageBubbleProps {
  message: ChatMessage
  /** Pass true on the last AI message to show the streaming cursor */
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  /* ── User message — right-aligned bubble ──────────────────────── */
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed text-white whitespace-pre-wrap"
          style={{
            background: 'linear-gradient(135deg, #6c63ff 0%, #7c72ff 100%)',
            boxShadow: '0 2px 12px rgba(108, 99, 255, 0.25), 0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  /* ── AI message — no bubble, clean prose (ChatGPT / Claude style) ── */
  return (
    <div className="space-y-3">
      {/* The response text itself — no card, no border, full width */}
      <MarkdownContent content={message.content} isStreaming={isStreaming} />

      {/* Compact metadata row below the text */}
      {(message.mode || (message.sources && message.sources.length > 0)) && (
        <div className="flex flex-col gap-2">
          {message.mode && <ModeBadge mode={message.mode} />}
          {message.sources && message.sources.length > 0 && (
            <SourceChips sources={message.sources} />
          )}
        </div>
      )}
    </div>
  )
}


