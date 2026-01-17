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
    listChatMessages: build.query<ChatMessage[], string>({
      query: (sessionId) => `/api/v1/chats/${sessionId}/messages`,
      providesTags: (_result, _error, sessionId) => [{ type: 'ChatMessages', id: sessionId }],
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
  useListChatMessagesQuery,
  useCreateChatMessageMutation,
  useCreateSkillSuggestionMutation,
  useListSkillsQuery,
} = chatApi
