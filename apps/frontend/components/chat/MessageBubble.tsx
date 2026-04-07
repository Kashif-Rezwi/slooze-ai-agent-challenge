import type { ChatMessage } from '@/hooks/useChat'
import ModeBadge from './ModeBadge'
import SourceChips from './SourceChips'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
          isUser
            ? 'bg-[var(--color-user-bubble)] text-white'
            : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[var(--color-user-bubble)] text-white rounded-tr-sm'
              : 'bg-[var(--color-ai-bubble)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Mode badge + sources — only on AI messages */}
        {!isUser && (
          <div className="flex flex-col gap-1.5 w-full">
            {message.mode && <ModeBadge mode={message.mode} />}
            {message.sources && message.sources.length > 0 && (
              <SourceChips sources={message.sources} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
