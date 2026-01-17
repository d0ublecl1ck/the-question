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

it('opens skill picker when pressing $', async () => {
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
  const user = userEvent.setup()
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  const input = screen.getByPlaceholderText(/输入内容/)
  await user.click(input)
  await user.keyboard('$')
  expect(await screen.findByRole('heading', { name: '选择技能' })).toBeInTheDocument()
})
