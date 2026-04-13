import type { ChatMessage } from '@/hooks/useChat'
import ModeBadge from './ModeBadge'
import SourceChips from './SourceChips'
import MarkdownContent from './MarkdownContent'

interface MessageBubbleProps {
  message: ChatMessage
  /** Pass true on the last AI message to show the streaming cursor. */
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed text-white whitespace-pre-wrap"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
            boxShadow: '0 2px 12px var(--color-accent-glow), 0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <MarkdownContent content={message.content} isStreaming={isStreaming} />

      {!isStreaming && (message.mode || (message.sources && message.sources.length > 0)) && (
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
