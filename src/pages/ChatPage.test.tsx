import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi, beforeEach } from 'vitest'
import ChatPage from './ChatPage'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'
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

it('renders chat page with composer', async () => {
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
    data: [{ id: 'gpt-5.2-2025-12-11', label: 'GPT-5.2' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(await screen.findByText('今天可以帮你做什么？')).toBeInTheDocument()
  expect(screen.getByTestId('chat-right-panel')).toHaveClass('w-full')
  expect(screen.getAllByText('历史对话').length).toBeGreaterThan(0)
  expect(screen.queryByText('以访客身份探索？登录以获取完整体验')).not.toBeInTheDocument()
  expect(await screen.findByPlaceholderText('输入内容，按 $ 触发技能选择')).toBeInTheDocument()
})

it('renders login entry when unauthenticated', () => {
  store.dispatch(clearAuth())
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
    data: [],
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
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListSkillsQuery>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByRole('button', { name: '去登录' })).toBeInTheDocument()
})
