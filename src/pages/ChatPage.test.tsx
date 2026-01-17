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
  useListChatMessagesQuery,
  useListSkillsQuery,
} from '@/store/api/chatApi'
import { useListAiModelsQuery } from '@/store/api/aiApi'

vi.mock('@/store/api/chatApi', () => ({
  useCreateChatSessionMutation: vi.fn(),
  useCreateSkillSuggestionMutation: vi.fn(),
  useListChatMessagesQuery: vi.fn(),
  useListSkillsQuery: vi.fn(),
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
  vi.mocked(useCreateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useCreateSkillSuggestionMutation>)
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
  vi.mocked(useListChatMessagesQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatMessagesQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(await screen.findByText('对话')).toBeInTheDocument()
  expect(await screen.findByPlaceholderText('输入内容，按 $ 触发技能选择')).toBeInTheDocument()
})

it('renders login entry when unauthenticated', () => {
  store.dispatch(clearAuth())
  vi.mocked(useCreateChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false },
  ] as ReturnType<typeof useCreateChatSessionMutation>)
  vi.mocked(useCreateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useCreateSkillSuggestionMutation>)
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
  vi.mocked(useListChatMessagesQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatMessagesQuery>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByRole('button', { name: '去登录' })).toBeInTheDocument()
})
