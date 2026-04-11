'use client'

import { useState, useCallback } from 'react'
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
  sendMessage: (text: string, documentIds?: string[]) => Promise<void>
}

// SSE event shapes emitted by POST /api/chat
type SseEvent =
  | { type: 'meta'; sources: string[]; mode: Mode }
  | { type: 'text'; chunk: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string, documentIds?: string[]) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)

    // Add user message + empty assistant placeholder together so the UI
    // renders the typing indicator immediately, then fills in as tokens arrive.
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const assistantId = crypto.randomUUID()
    setMessages(prev => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setIsLoading(true)

    try {
      const body: Record<string, unknown> = { message: trimmed }
      if (documentIds && documentIds.length > 0) body.documentIds = documentIds

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // SSE lines are separated by \n\n; split and keep any partial line in buffer
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            let event: SseEvent
            try { event = JSON.parse(raw) as SseEvent } catch { continue }

            if (event.type === 'meta') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, sources: event.sources, mode: event.mode }
                  : m
              ))
            } else if (event.type === 'text') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.chunk }
                  : m
              ))
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
            // 'done' event — loop ends naturally when stream closes
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      // Replace the empty placeholder with a visible error message
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { messages, isLoading, error, sendMessage }
}
