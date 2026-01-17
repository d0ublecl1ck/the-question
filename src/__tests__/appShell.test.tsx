import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it } from 'vitest'
import AppShell from '../components/AppShell'
import { useAuthStore } from '../stores/authStore'

it('renders the top bar with title and nav', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  const title = screen.getByText('WenDui')
  expect(title).toBeInTheDocument()
  expect(title).toHaveClass('text-2xl', 'font-semibold')
  expect(screen.getByText('Home')).toBeInTheDocument()
  expect(screen.getByText('About')).toBeInTheDocument()
  expect(screen.getByText('Price')).toBeInTheDocument()
  expect(screen.getByText('Login')).toBeInTheDocument()
  expect(screen.queryByText('\u672a\u767b\u5f55')).not.toBeInTheDocument()
  fireEvent.mouseEnter(screen.getByTestId('account-trigger'))
  expect(screen.getByText('\u672a\u767b\u5f55')).toBeInTheDocument()
  expect(screen.getByRole('navigation').querySelector('svg')).toBeNull()
})

it('does not render the global top bar', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  expect(screen.queryByText('Workspace')).not.toBeInTheDocument()
  expect(screen.queryByText('\u6280\u80fd\u9a71\u52a8\u5bf9\u8bdd')).not.toBeInTheDocument()
})

it('shows account email when authenticated', () => {
  useAuthStore.getState().setAuth({
    token: 'token-1',
    user: { id: 'u1', email: 'admin@admin.com' },
  })
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  expect(screen.queryByText('admin@admin.com')).not.toBeInTheDocument()
  fireEvent.mouseEnter(screen.getByTestId('account-trigger'))
  expect(screen.getByText('admin@admin.com')).toBeInTheDocument()
})

it('centers page content within the shell', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  const main = screen.getByRole('main')
  expect(main).toHaveClass('justify-center')
  expect(main).toHaveClass('w-full', 'px-[5%]')
})
