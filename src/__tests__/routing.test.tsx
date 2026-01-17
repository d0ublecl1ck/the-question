import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { routes } from '../app/routes'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'

beforeEach(() => {
  store.dispatch(clearAuth())
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.includes('/api/v1/chats')) {
      if (url.includes('/messages')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    }
    if (url.includes('/api/v1/skills')) {
      return new Response(JSON.stringify([]), { status: 200 })
    }
    if (url.includes('/api/v1/ai/models')) {
      return new Response(JSON.stringify([]), { status: 200 })
    }
    return new Response(JSON.stringify({}), { status: 200 })
  }))
})

it('renders home page at root when unauthenticated', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '问对' })).toBeInTheDocument()
})

it('renders home page at root when authenticated', () => {
  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'user@example.com' } }))
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '问对' })).toBeInTheDocument()
})

it('renders chat page at /chat when authenticated', () => {
  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'user@example.com' } }))
  const router = createMemoryRouter(routes, { initialEntries: ['/chat'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '对话' })).toBeInTheDocument()
})

it('renders chat session at /chat/:sessionId when authenticated', () => {
  store.dispatch(setAuth({ token: 'token-1', user: { id: 'u1', email: 'user@example.com' } }))
  const router = createMemoryRouter(routes, { initialEntries: ['/chat/session-1'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '对话' })).toBeInTheDocument()
})

it('renders login page at /login', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/login'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: 'WenDui' })).toBeInTheDocument()
})
