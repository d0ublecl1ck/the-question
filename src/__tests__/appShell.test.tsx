import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import AppShell from '../components/AppShell'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'

beforeEach(() => {
  store.dispatch(clearAuth())
})

it('renders the top bar with title and nav', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  const title = screen.getByText('WenDui')
  expect(title).toBeInTheDocument()
  expect(title).toHaveClass('text-2xl', 'font-semibold')
  expect(screen.getByText('Home')).toBeInTheDocument()
  expect(screen.getByText('About')).toBeInTheDocument()
  expect(screen.getByText('Price')).toBeInTheDocument()
  expect(screen.getByText('Login')).toBeInTheDocument()
  expect(screen.queryByText('未登录')).not.toBeInTheDocument()
  fireEvent.mouseEnter(screen.getByTestId('account-trigger'))
  expect(screen.getByText('未登录')).toBeInTheDocument()
  expect(screen.getByRole('navigation').querySelector('svg')).toBeNull()
})

it('does not render the global top bar', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  expect(screen.queryByText('Workspace')).not.toBeInTheDocument()
  expect(screen.queryByText('技能驱动对话')).not.toBeInTheDocument()
})

it('shows account email when authenticated', () => {
  store.dispatch(
    setAuth({
      token: 'token-1',
      user: { id: 'u1', email: 'admin@admin.com' },
    }),
  )
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  expect(screen.queryByText('admin@admin.com')).not.toBeInTheDocument()
  fireEvent.mouseEnter(screen.getByTestId('account-trigger'))
  expect(screen.getByText('admin@admin.com')).toBeInTheDocument()
})

it('centers page content within the shell', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  const main = screen.getByRole('main')
  expect(main).toHaveClass('justify-center')
  expect(main).toHaveClass('w-full', 'px-[5%]')
})
