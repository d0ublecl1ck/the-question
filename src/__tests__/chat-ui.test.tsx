import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { expect, it, vi, beforeEach } from 'vitest'
import ChatPage from '../pages/ChatPage'
import { MemoryRouter } from 'react-router-dom'
import { store } from '@/store/appStore'
import { setAuth } from '@/store/slices/authSlice'
import {
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
  useLazyListChatMessagesQuery,
  useListChatMessagesQuery,
  useListChatSessionsQuery,
  useListSkillsQuery,
  useListSkillSuggestionsQuery,
  useListSkillDraftSuggestionsQuery,
  useUpdateSkillDraftSuggestionMutation,
  useAcceptSkillDraftSuggestionMutation,
  useUpdateChatSessionTitleMutation,
  useUpdateSkillSuggestionMutation,
} from '@/store/api/chatApi'
import { useListAiModelsQuery } from '@/store/api/aiApi'

vi.mock('@/store/api/chatApi', () => ({
  useCreateChatSessionMutation: vi.fn(),
  useDeleteChatSessionMutation: vi.fn(),
  useLazyListChatMessagesQuery: vi.fn(),
  useListChatMessagesQuery: vi.fn(),
  useListChatSessionsQuery: vi.fn(),
  useListSkillsQuery: vi.fn(),
  useListSkillSuggestionsQuery: vi.fn(),
  useListSkillDraftSuggestionsQuery: vi.fn(),
  useUpdateSkillDraftSuggestionMutation: vi.fn(),
  useAcceptSkillDraftSuggestionMutation: vi.fn(),
  useUpdateChatSessionTitleMutation: vi.fn(),
  useUpdateSkillSuggestionMutation: vi.fn(),
}))

vi.mock('@/store/api/aiApi', () => ({
  useListAiModelsQuery: vi.fn(),
}))

beforeEach(() => {
  store.dispatch(setAuth({ token: 'token', user: { id: 'u1', email: 'a@b.com' } }))
  vi.mocked(useListSkillSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillSuggestionsQuery>)
  vi.mocked(useListSkillDraftSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillDraftSuggestionsQuery>)
  vi.mocked(useUpdateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useUpdateSkillDraftSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useUpdateSkillDraftSuggestionMutation>)
  vi.mocked(useAcceptSkillDraftSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useAcceptSkillDraftSuggestionMutation>)
})

it('opens skill picker when clicking skill icon', async () => {
  vi.mocked(useCreateChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useCreateChatSessionMutation>)
  vi.mocked(useUpdateChatSessionTitleMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useUpdateChatSessionTitleMutation>)
  vi.mocked(useDeleteChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useDeleteChatSessionMutation>)
  vi.mocked(useListChatSessionsQuery).mockReturnValue({
    data: [{ id: 's1', title: '历史对话' }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListChatSessionsQuery>)
  const previewTrigger = vi.fn().mockResolvedValue({ data: [] })
  vi.mocked(useLazyListChatMessagesQuery).mockReturnValue([
    previewTrigger,
    { isFetching: false, reset: vi.fn() },
    { lastArg: { sessionId: 's1' } },
  ])
  vi.mocked(useListChatMessagesQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListChatMessagesQuery>)
  vi.mocked(useListSkillsQuery).mockReturnValue({
    data: [{ id: 'skill-1', name: '需求澄清', description: 'desc', tags: ['tag'] }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillsQuery>)
  vi.mocked(useListSkillSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillSuggestionsQuery>)
  vi.mocked(useUpdateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListAiModelsQuery>)

  const user = userEvent.setup()
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  const skillButton = screen.getByRole('button', { name: '选择技能' })
  await user.click(skillButton)
  expect(await screen.findByRole('heading', { name: '选择技能' })).toBeInTheDocument()
})
