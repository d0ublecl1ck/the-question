import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { routes } from '../app/routes'

it('renders chat page at root', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: /chat/i })).toBeInTheDocument()
})

it('renders login page at /login', () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/login'] })
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
})
