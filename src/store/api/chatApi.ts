import { baseApi } from './baseApi'
import type {
  ChatMessage,
  ChatSession,
  SkillItem,
  SkillSuggestion,
  SkillSuggestionStatus,
  SkillDraftSuggestion,
  SkillDraftAcceptResult,
} from './types'

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
    listSkillSuggestions: build.query<
      SkillSuggestion[],
      { sessionId: string; status?: SkillSuggestionStatus }
    >({
      query: ({ sessionId, status }) => {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        const query = params.toString()
        return `/api/v1/chats/${sessionId}/suggestions${query ? `?${query}` : ''}`
      },
      providesTags: (_result, _error, { sessionId }) => [{ type: 'SkillSuggestions', id: sessionId }],
    }),
    updateSkillSuggestion: build.mutation<
      SkillSuggestion,
      { sessionId: string; suggestionId: string; status: SkillSuggestionStatus }
    >({
      query: ({ sessionId, suggestionId, status }) => ({
        url: `/api/v1/chats/${sessionId}/suggestions/${suggestionId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [{ type: 'SkillSuggestions', id: sessionId }],
    }),
    listSkillDraftSuggestions: build.query<
      SkillDraftSuggestion[],
      { sessionId: string; status?: SkillSuggestionStatus }
    >({
      query: ({ sessionId, status }) => {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        const query = params.toString()
        return `/api/v1/chats/${sessionId}/draft-suggestions${query ? `?${query}` : ''}`
      },
      providesTags: (_result, _error, { sessionId }) => [{ type: 'SkillDraftSuggestions', id: sessionId }],
    }),
    updateSkillDraftSuggestion: build.mutation<
      SkillDraftSuggestion,
      { sessionId: string; suggestionId: string; status: SkillSuggestionStatus }
    >({
      query: ({ sessionId, suggestionId, status }) => ({
        url: `/api/v1/chats/${sessionId}/draft-suggestions/${suggestionId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [{ type: 'SkillDraftSuggestions', id: sessionId }],
    }),
    acceptSkillDraftSuggestion: build.mutation<
      SkillDraftAcceptResult,
      { sessionId: string; suggestionId: string; modelId?: string | null }
    >({
      query: ({ sessionId, suggestionId, modelId }) => ({
        url: `/api/v1/chats/${sessionId}/draft-suggestions/${suggestionId}/accept`,
        method: 'POST',
        body: { model: modelId ?? null },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'SkillDraftSuggestions', id: sessionId },
        'Skills',
      ],
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
  useListSkillSuggestionsQuery,
  useUpdateSkillSuggestionMutation,
  useListSkillDraftSuggestionsQuery,
  useUpdateSkillDraftSuggestionMutation,
  useAcceptSkillDraftSuggestionMutation,
  useListSkillsQuery,
} = chatApi
