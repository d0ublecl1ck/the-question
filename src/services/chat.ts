import { authFetch } from '@/services/http'

export type ChatSession = {
  id: string
  title?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  skill_id?: string | null
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const response = await authFetch('/api/v1/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title ?? '会话' }),
  })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function listChatMessages(
  sessionId: string,
  params?: { limit?: number; offset?: number },
): Promise<ChatMessage[]> {
  const searchParams = new URLSearchParams()
  if (typeof params?.limit === 'number') {
    searchParams.set('limit', params.limit.toString())
  }
  if (typeof params?.offset === 'number') {
    searchParams.set('offset', params.offset.toString())
  }
  const query = searchParams.toString()
  const response = await authFetch(`/api/v1/chats/${sessionId}/messages${query ? `?${query}` : ''}`)
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const response = await authFetch('/api/v1/chats')
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function updateChatSessionTitle(
  sessionId: string,
  title: string,
): Promise<ChatSession> {
  const response = await authFetch(`/api/v1/chats/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await authFetch(`/api/v1/chats/${sessionId}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
}

export async function createChatMessage(
  sessionId: string,
  payload: { role: 'user' | 'assistant' | 'system'; content: string; skill_id?: string | null },
): Promise<ChatMessage> {
  const response = await authFetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function createSkillSuggestion(payload: {
  session_id: string
  skill_id: string
  message_id?: string
}) {
  const response = await authFetch('/api/v1/skill-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}
