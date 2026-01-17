import { authFetch } from '@/services/http'

export type ChatSession = {
  id: string
  title?: string | null
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

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await authFetch(`/api/v1/chats/${sessionId}/messages`)
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
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
