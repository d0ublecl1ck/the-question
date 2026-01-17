import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import { routes } from '../app/routes'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'

beforeEach(() => {
  store.dispatch(clearAuth())
})

it('renders home page at root when unauthenticated', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()
})

it('renders home page at root when authenticated', () => {
  store.dispatch(setAuth({
    token: 'token-1',
    user: { id: 'u1', email: 'user@example.com' },
  }))
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()
})

it('renders chat page at /chat when authenticated', () => {
  store.dispatch(setAuth({
    token: 'token-1',
    user: { id: 'u1', email: 'user@example.com' },
  }))
  const router = createMemoryRouter(routes, { initialEntries: ['/chat'] })
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
