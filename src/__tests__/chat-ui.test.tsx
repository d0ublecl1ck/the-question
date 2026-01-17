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
  useCreateSkillSuggestionMutation,
  useDeleteChatSessionMutation,
  useLazyListChatMessagesQuery,
  useListChatMessagesQuery,
  useListChatSessionsQuery,
  useListSkillsQuery,
  useUpdateChatSessionTitleMutation,
} from '@/store/api/chatApi'
import { useListAiModelsQuery } from '@/store/api/aiApi'

vi.mock('@/store/api/chatApi', () => ({
  useCreateChatSessionMutation: vi.fn(),
  useCreateSkillSuggestionMutation: vi.fn(),
  useDeleteChatSessionMutation: vi.fn(),
  useLazyListChatMessagesQuery: vi.fn(),
  useListChatMessagesQuery: vi.fn(),
  useListChatSessionsQuery: vi.fn(),
  useListSkillsQuery: vi.fn(),
  useUpdateChatSessionTitleMutation: vi.fn(),
}))

vi.mock('@/store/api/aiApi', () => ({
  useListAiModelsQuery: vi.fn(),
}))

beforeEach(() => {
  store.dispatch(setAuth({ token: 'token', user: { id: 'u1', email: 'a@b.com' } }))
})

it('opens skill picker when clicking skill icon', async () => {
  vi.mocked(useCreateChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false },
  ] as ReturnType<typeof useCreateChatSessionMutation>)
  vi.mocked(useUpdateChatSessionTitleMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateChatSessionTitleMutation>)
  vi.mocked(useDeleteChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useDeleteChatSessionMutation>)
  vi.mocked(useCreateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useCreateSkillSuggestionMutation>)
  vi.mocked(useListChatSessionsQuery).mockReturnValue({
    data: [{ id: 's1', title: '历史对话' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatSessionsQuery>)
  const previewTrigger = vi.fn().mockResolvedValue({ data: [] })
  vi.mocked(useLazyListChatMessagesQuery).mockReturnValue([previewTrigger, { isFetching: false }])
  vi.mocked(useListChatMessagesQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatMessagesQuery>)
  vi.mocked(useListSkillsQuery).mockReturnValue({
    data: [{ id: 'skill-1', name: '需求澄清', description: 'desc', tags: ['tag'] }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListSkillsQuery>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2' }],
    isLoading: false,
    isError: false,
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
