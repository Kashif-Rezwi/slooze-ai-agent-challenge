'use client'

import { useState, useCallback, useRef } from 'react'
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

// Wire format for a history turn — only role + content cross the network boundary.
type HistoryTurn = { role: 'user' | 'assistant'; content: string }

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Always-current snapshot of messages without adding it to useCallback deps.
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages

  const sendMessage = useCallback(async (text: string, documentIds?: string[]) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)

    const history: HistoryTurn[] = messagesRef.current
      .filter(m => m.content.trim().length > 0)
      .slice(-6) // last 3 exchanges (6 turns)
      .map(m => ({ role: m.role, content: m.content }))

    // Add user message + empty assistant placeholder together so the typing indicator
    // appears immediately while the stream fills in tokens.
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
      if (history.length > 0) body.messages = history

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
        // SSE frames are delimited by \n\n; keep any partial frame in the buffer.
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
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { messages, isLoading, error, sendMessage }
}
