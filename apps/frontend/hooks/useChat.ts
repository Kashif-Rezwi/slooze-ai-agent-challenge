/**
 * Phase 3: custom hook — simple fetch against backend plain-JSON response.
 *
 * Phase 4 replaces this with @ai-sdk/react useChat once the backend switches
 * to the AI SDK streaming protocol. The component API (messages, isLoading,
 * sendMessage) is intentionally stable so components need no changes.
 */
import { useState, useCallback } from 'react'
import { postChat } from '@/lib/api'
import type { Mode } from '@slooze/shared'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  mode?: Mode
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string, documentId?: string | null) => Promise<void>
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string, documentId?: string | null) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const data = await postChat(trimmed, documentId)
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        mode: data.mode,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      // Show the error inline as a failed assistant message so the user sees it
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${msg}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { messages, isLoading, error, sendMessage }
}
