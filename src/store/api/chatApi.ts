import { baseApi } from './baseApi'
import type { ChatMessage, ChatSession, SkillItem } from './types'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createChatSession: build.mutation<ChatSession, { title?: string }>({
      query: ({ title }) => ({
        url: '/api/v1/chat/sessions',
        method: 'POST',
        body: { title: title ?? '会话' },
      }),
    }),
    listChatSessions: build.query<ChatSession[], void>({
      query: () => '/api/v1/chats',
      providesTags: ['ChatSessions'],
    }),
    updateChatSessionTitle: build.mutation<ChatSession, { sessionId: string; title: string }>({
      query: ({ sessionId, title }) => ({
        url: `/api/v1/chats/${sessionId}`,
        method: 'PATCH',
        body: { title },
      }),
      invalidatesTags: ['ChatSessions'],
    }),
    deleteChatSession: build.mutation<void, string>({
      query: (sessionId) => ({
        url: `/api/v1/chats/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatSessions'],
    }),
    listChatMessages: build.query<ChatMessage[], { sessionId: string; limit?: number; offset?: number }>({
      query: ({ sessionId, limit, offset }) => {
        const params = new URLSearchParams()
        if (typeof limit === 'number') params.set('limit', limit.toString())
        if (typeof offset === 'number') params.set('offset', offset.toString())
        const query = params.toString()
        return `/api/v1/chats/${sessionId}/messages${query ? `?${query}` : ''}`
      },
      providesTags: (_result, _error, { sessionId }) => [{ type: 'ChatMessages', id: sessionId }],
    }),
    createChatMessage: build.mutation<ChatMessage, { sessionId: string; payload: { role: 'user' | 'assistant' | 'system'; content: string; skill_id?: string | null } }>({
      query: ({ sessionId, payload }) => ({
        url: `/api/v1/chat/sessions/${sessionId}/messages`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [{ type: 'ChatMessages', id: sessionId }],
    }),
    createSkillSuggestion: build.mutation<unknown, { session_id: string; skill_id: string; message_id?: string }>({
      query: (payload) => ({
        url: '/api/v1/skill-suggestions',
        method: 'POST',
        body: payload,
      }),
    }),
    listSkills: build.query<SkillItem[], void>({
      query: () => '/api/v1/skills',
      providesTags: ['Skills'],
    }),
  }),
})

export const {
  useCreateChatSessionMutation,
  useListChatSessionsQuery,
  useUpdateChatSessionTitleMutation,
  useDeleteChatSessionMutation,
  useListChatMessagesQuery,
  useLazyListChatMessagesQuery,
  useCreateChatMessageMutation,
  useCreateSkillSuggestionMutation,
  useListSkillsQuery,
} = chatApi
