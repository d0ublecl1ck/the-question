import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import { routes } from '../app/routes'
import { useAuthStore } from '../stores/authStore'

beforeEach(() => {
  useAuthStore.getState().clearAuth()
})

it('renders home page at root when unauthenticated', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()
})

it('renders home page at root when authenticated', () => {
  useAuthStore.getState().setAuth({
    token: 'token-1',
    user: { id: 'u1', email: 'user@example.com' },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()
})

it('renders chat page at /chat when authenticated', () => {
  useAuthStore.getState().setAuth({
    token: 'token-1',
    user: { id: 'u1', email: 'user@example.com' },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/chat'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: '对话' })).toBeInTheDocument()
})

it('renders login page at /login', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/login'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: 'WenDui' })).toBeInTheDocument()
})
