import { beforeEach, expect, it, vi } from 'vitest'
import { chatApi } from '@/store/api/chatApi'
import { store } from '@/store/appStore'
import { clearAuth } from '@/store/slices/authSlice'

beforeEach(() => {
  store.dispatch(clearAuth())
  store.dispatch(chatApi.util.resetApiState())
  vi.restoreAllMocks()
})

it('builds listChatMessages query params', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  const result = store.dispatch(
    chatApi.endpoints.listChatMessages.initiate({ sessionId: 's1', limit: 1, offset: 2 }),
  )
  await result.unwrap()

  const [input] = fetchMock.mock.calls[0]
  const url = typeof input === 'string' ? input : input.url
  expect(url).toContain('/api/v1/chats/s1/messages')
  expect(url).toContain('limit=1')
  expect(url).toContain('offset=2')
})

it('requests chat sessions list', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  const result = store.dispatch(chatApi.endpoints.listChatSessions.initiate())
  await result.unwrap()

  const [input] = fetchMock.mock.calls[0]
  const url = typeof input === 'string' ? input : input.url
  expect(url).toContain('/api/v1/chats')
})
