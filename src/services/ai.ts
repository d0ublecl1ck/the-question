import { authFetch } from '@/services/http'

export type AiModelOption = {
  id: string
  label: string
}

type StreamHandlers = {
  onDelta: (delta: string) => void
  onError?: (error: Error) => void
}

export async function listAiModels(): Promise<AiModelOption[]> {
  const response = await authFetch('/api/v1/ai/models')
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function streamAiChat(
  payload: {
    sessionId: string
    content: string
    model: string
    skillId?: string | null
  },
  handlers: StreamHandlers,
) {
  const response = await authFetch('/api/v1/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: payload.sessionId,
      content: payload.content,
      model: payload.model,
      skill_id: payload.skillId ?? null,
    }),
  })

  if (!response.ok || !response.body) {
    const error = new Error(`Request failed with ${response.status}`)
    handlers.onError?.(error)
    throw error
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let delimiterIndex = buffer.indexOf('\n\n')
      while (delimiterIndex !== -1) {
        const raw = buffer.slice(0, delimiterIndex).trim()
        buffer = buffer.slice(delimiterIndex + 2)
        if (raw.startsWith('data:')) {
          const payloadText = raw.replace(/^data:\s*/, '')
          if (payloadText === '[DONE]') {
            return
          }
          try {
            const parsed = JSON.parse(payloadText) as { type?: string; content?: string; message?: string }
            if (parsed.type === 'delta' && parsed.content) {
              handlers.onDelta(parsed.content)
            } else if (parsed.type === 'error') {
              const error = new Error(parsed.message ?? 'Stream error')
              handlers.onError?.(error)
            }
          } catch (error) {
            handlers.onError?.(error as Error)
          }
        }
        delimiterIndex = buffer.indexOf('\n\n')
      }
    }
  } finally {
    reader.releaseLock()
  }
}
