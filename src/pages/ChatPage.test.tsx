import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, it, vi, beforeEach } from 'vitest'
import ChatPage, { __testables__ } from './ChatPage'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'
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

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-display">{location.pathname}</div>
}

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
    { isLoading: false },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useUpdateSkillDraftSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateSkillDraftSuggestionMutation>)
  vi.mocked(useAcceptSkillDraftSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useAcceptSkillDraftSuggestionMutation>)
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
  vi.mocked(useListSkillSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillSuggestionsQuery>)
  vi.mocked(useUpdateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(await screen.findByText('今天可以帮你做什么？')).toBeInTheDocument()
  const bannerLink = screen.getByRole('link', { name: '前往 watcha.cn' })
  expect(bannerLink).toHaveAttribute('href', 'https://watcha.cn/')
  expect(screen.getByTestId('chat-right-panel')).toHaveClass('w-full')
  expect(screen.getByTestId('chat-right-panel')).toHaveClass('mx-auto')
  expect(screen.getByTestId('chat-right-panel')).toHaveClass('max-w-4xl')
  expect(screen.getByTestId('chat-right-panel')).toHaveClass('pt-[20vh]')
  expect(screen.getAllByText('历史对话').length).toBeGreaterThan(0)
  expect(screen.queryByText('以访客身份探索？登录以获取完整体验')).not.toBeInTheDocument()
  expect(await screen.findByPlaceholderText('输入内容，回车发送')).toBeInTheDocument()
})

it('prefills draft from navigation state', async () => {
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
  vi.mocked(useListSkillSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillSuggestionsQuery>)
  vi.mocked(useUpdateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/chat', state: { draft: '想聊的内容' } }]}>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )

  const input = await screen.findByPlaceholderText('输入内容，回车发送')
  await waitFor(() => expect(input).toHaveValue('想聊的内容'))
})

it('uses preview as fallback title when session name is default', async () => {
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
  vi.mocked(useListChatSessionsQuery).mockReturnValue({
    data: [{ id: 's1', title: '对话' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatSessionsQuery>)
  const previewTrigger = vi.fn().mockReturnValue({
    unwrap: () => Promise.resolve([{ content: '请帮我做市场规模分析' }]),
  })
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
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )

  expect(await screen.findByText('请帮我做市场规模分析')).toBeInTheDocument()
})

it('asks for confirmation before deleting a session', async () => {
  const deleteMutation = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) })
  vi.mocked(useCreateChatSessionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false },
  ] as ReturnType<typeof useCreateChatSessionMutation>)
  vi.mocked(useUpdateChatSessionTitleMutation).mockReturnValue([
    vi.fn().mockResolvedValue({ id: 's1', title: '对话' }),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateChatSessionTitleMutation>)
  vi.mocked(useDeleteChatSessionMutation).mockReturnValue([
    deleteMutation,
    { isLoading: false },
  ] as ReturnType<typeof useDeleteChatSessionMutation>)
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
  vi.mocked(useListSkillSuggestionsQuery).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillSuggestionsQuery>)
  vi.mocked(useUpdateSkillSuggestionMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useUpdateSkillSuggestionMutation>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
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

  const user = userEvent.setup()
  const deleteButton = await screen.findByRole('button', { name: '删除' })
  await user.click(deleteButton)
  expect(deleteMutation).not.toHaveBeenCalled()

  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: '删除' }))
  expect(deleteMutation).toHaveBeenCalledWith('s1')
})

it('hides the promo banner on a session route', async () => {
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
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/chat/session-1']}>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )

  expect(await screen.findByTestId('chat-right-panel')).toBeInTheDocument()
  expect(screen.queryByText('今天可以帮你做什么？')).not.toBeInTheDocument()
  expect(screen.queryByText('深蓝的天空中挂着一轮金黄的圆月......')).not.toBeInTheDocument()
})

it('navigates to the session route and shows messages when selecting history', async () => {
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
  vi.mocked(useListChatSessionsQuery).mockReturnValue({
    data: [
      { id: 's1', title: '历史对话一' },
      { id: 's2', title: '历史对话二' },
    ],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatSessionsQuery>)
  const previewTrigger = vi.fn().mockResolvedValue({ data: [] })
  vi.mocked(useLazyListChatMessagesQuery).mockReturnValue([previewTrigger, { isFetching: false }])
  vi.mocked(useListChatMessagesQuery).mockReturnValue({
    data: [{ id: 'm1', role: 'assistant', content: '历史消息', skill_id: null }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListChatMessagesQuery>)
  vi.mocked(useListSkillsQuery).mockReturnValue({
    data: [{ id: 'skill-1', name: '需求澄清', description: 'desc', tags: ['tag'] }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListSkillsQuery>)
  vi.mocked(useListAiModelsQuery).mockReturnValue({
    data: [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useListAiModelsQuery>)

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/chat']}>
        <LocationDisplay />
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )

  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: '历史对话二' }))
  expect(await screen.findByTestId('location-display')).toHaveTextContent('/chat/s2')
  expect(await screen.findByText('历史消息')).toBeInTheDocument()
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

it('compares session lists for equality', () => {
  const { areSessionsEqual } = __testables__
  const base = [{ id: 's1', title: '对话', created_at: '1', updated_at: '2' }]
  expect(areSessionsEqual(base, base)).toBe(true)
  expect(areSessionsEqual(base, [{ id: 's1', title: '对话', created_at: '1', updated_at: '2' }])).toBe(true)
  expect(areSessionsEqual(base, [{ id: 's1', title: '变更', created_at: '1', updated_at: '2' }])).toBe(
    false,
  )
  expect(areSessionsEqual(base, [{ id: 's2', title: '对话' }])).toBe(false)
})

it('compares message lists for equality', () => {
  const { areMessagesEqual } = __testables__
  const base = [{ id: 'm1', role: 'user', content: 'hi', skill_id: null }]
  expect(areMessagesEqual(base, base)).toBe(true)
  expect(areMessagesEqual(base, [{ id: 'm1', role: 'user', content: 'hi', skill_id: null }])).toBe(
    true,
  )
  expect(areMessagesEqual(base, [{ id: 'm1', role: 'user', content: 'hello', skill_id: null }])).toBe(
    false,
  )
  expect(areMessagesEqual(base, [{ id: 'm2', role: 'assistant', content: 'hi', skill_id: null }])).toBe(
    false,
  )
})

it('compares session preview maps for equality', () => {
  const { arePeekEqual } = __testables__
  const base = { s1: 'a', s2: 'b' }
  expect(arePeekEqual(base, { s1: 'a', s2: 'b' })).toBe(true)
  expect(arePeekEqual(base, { s2: 'b', s1: 'a' })).toBe(true)
  expect(arePeekEqual(base, { s1: 'a' })).toBe(false)
  expect(arePeekEqual(base, { s1: 'a', s2: 'c' })).toBe(false)
})
