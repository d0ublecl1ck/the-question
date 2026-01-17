import { store } from '@/store/appStore'

type StreamPayload = {
  type?: 'start' | 'snapshot' | 'delta' | 'error'
  content?: string
  message?: string
  message_id?: string
}

type StreamHandlers = {
  onStart?: (messageId: string, content: string) => void
  onSnapshot?: (messageId: string, content: string) => void
  onDelta: (delta: string, messageId: string) => void
  onError?: (error: Error) => void
  onDone?: () => void
}

type StreamFetchOptions = {
  signal?: AbortSignal
}

const consumeStream = async (response: Response, handlers: StreamHandlers) => {
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
            handlers.onDone?.()
            return
          }
          try {
            const parsed = JSON.parse(payloadText) as StreamPayload
            const messageId = parsed.message_id ?? ''
            if (parsed.type === 'start' && messageId) {
              handlers.onStart?.(messageId, parsed.content ?? '')
            } else if (parsed.type === 'snapshot' && messageId) {
              handlers.onSnapshot?.(messageId, parsed.content ?? '')
            } else if (parsed.type === 'delta' && parsed.content && messageId) {
              handlers.onDelta(parsed.content, messageId)
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

export async function streamAiChat(
  payload: {
    sessionId: string
    content: string
    model: string
    skillId?: string | null
  },
  handlers: StreamHandlers,
  options: StreamFetchOptions = {},
) {
  const token = store.getState().auth.token
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch('/api/v1/ai/chat/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: payload.sessionId,
      content: payload.content,
      model: payload.model,
      skill_id: payload.skillId ?? null,
    }),
    signal: options.signal,
  })

  await consumeStream(response, handlers)
}

export async function watchAiChatStream(
  payload: { sessionId: string },
  handlers: StreamHandlers,
  options: StreamFetchOptions = {},
) {
  const token = store.getState().auth.token
  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(
    `/api/v1/ai/chat/stream/watch?session_id=${encodeURIComponent(payload.sessionId)}`,
    {
      method: 'GET',
      headers,
      signal: options.signal,
    },
  )
  await consumeStream(response, handlers)
}
