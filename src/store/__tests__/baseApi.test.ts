import { beforeEach, expect, it, vi } from 'vitest'
import { baseApi } from '@/store/api/baseApi'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPing: build.query<{ ok: boolean }, void>({
      query: () => ({ url: '/api/ping' }),
    }),
    login: build.mutation<void, { email: string; password: string }>({
      query: (payload) => ({ url: '/api/v1/auth/login', method: 'POST', body: payload }),
    }),
  }),
})

const readAuthHeader = (input: RequestInfo | URL | undefined, headers: HeadersInit | undefined) => {
  if (input instanceof Request) {
    return input.headers.get('Authorization') ?? undefined
  }
  if (input instanceof URL) return undefined
  if (!headers) return undefined
  if (headers instanceof Headers) return headers.get('Authorization') ?? undefined
  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => key.toLowerCase() === 'authorization')
    return entry?.[1]
  }
  return headers['Authorization'] ?? headers['authorization']
}

beforeEach(() => {
  store.dispatch(clearAuth())
  store.dispatch(testApi.util.resetApiState())
  vi.restoreAllMocks()
})

it('injects auth header when token is present', async () => {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'a@b.com' } }))

  const result = store.dispatch(testApi.endpoints.getPing.initiate())
  await result.unwrap()

  const [input, init] = fetchMock.mock.calls[0]
  expect(readAuthHeader(input, init?.headers)).toBe('Bearer token-1')
})

it('clears auth and enqueues toast on 401', async () => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify({ detail: 'unauthorized' }), { status: 401 }),
  )
  vi.stubGlobal('fetch', fetchMock)

  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'a@b.com' } }))
  const initialToastCount = store.getState().toast.toasts.length

  const result = store.dispatch(testApi.endpoints.getPing.initiate())
  await result.unwrap().catch(() => undefined)

  expect(store.getState().auth.status).toBe('anonymous')
  expect(store.getState().toast.toasts.length).toBeGreaterThan(initialToastCount)
})

it('does not clear auth or enqueue toast on 401 from login', async () => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify({ detail: '账号不存在' }), { status: 401 }),
  )
  vi.stubGlobal('fetch', fetchMock)

  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'a@b.com' } }))
  const initialToastCount = store.getState().toast.toasts.length

  const result = store.dispatch(testApi.endpoints.login.initiate({ email: 'a@b.com', password: 'x' }))
  await result.unwrap().catch(() => undefined)

  expect(store.getState().auth.status).toBe('authenticated')
  expect(store.getState().toast.toasts.length).toBe(initialToastCount)
})
