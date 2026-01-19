import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import LoginPage from './LoginPage'
import { store } from '@/store/appStore'
import { useLoginWithProfileMutation, useRegisterWithProfileMutation } from '@/store/api/authApi'

vi.mock('@/store/api/authApi', () => ({
  useLoginWithProfileMutation: vi.fn(),
  useRegisterWithProfileMutation: vi.fn(),
}))

const LocationDisplay = () => {
  const location = useLocation()
  const draft = (location.state as { draft?: string } | null)?.draft ?? ''
  return (
    <div data-testid="location-display" data-draft={draft}>
      {location.pathname}
    </div>
  )
}

it('renders login page', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByText('WenDui')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
  expect(screen.queryByText('通过 Google 登录')).not.toBeInTheDocument()
  expect(screen.queryByText('使用 Apple 登录')).not.toBeInTheDocument()
  expect(screen.queryByText('通过 Lark 登录')).not.toBeInTheDocument()
})

it('renders split layout with brand panel', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByTestId('login-shell')).toHaveClass('md:flex-row')
  expect(screen.getByTestId('login-brand-panel')).toBeInTheDocument()
})

it('aligns brand paragraph to the logo edge', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByTestId('login-brand-copy')).toHaveClass('self-end')
})

it('disables page scroll while mounted', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  const previousBodyOverflow = document.body.style.overflow
  const previousRootOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'scroll'
  document.documentElement.style.overflow = 'auto'

  const { unmount } = render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )

  expect(document.body.style.overflow).toBe('hidden')
  expect(document.documentElement.style.overflow).toBe('hidden')

  unmount()
  expect(document.body.style.overflow).toBe('scroll')
  expect(document.documentElement.style.overflow).toBe('auto')

  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousRootOverflow
})

it('renders larger logo and brand styles', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByTestId('login-logo')).toHaveClass('h-40')
  expect(screen.getByTestId('login-logo')).toHaveClass('w-40')
  expect(screen.getByTestId('login-brand')).toHaveClass('text-3xl')
})

it('shows email validation error on submit', async () => {
  const user = userEvent.setup()
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  await user.type(screen.getByPlaceholderText('邮箱'), 'not-an-email')
  await user.type(screen.getByPlaceholderText('密码'), 'secret123')
  await user.click(screen.getByRole('button', { name: '邮箱登录' }))
  expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument()
})

it('redirects back to chat with draft after login', async () => {
  const user = userEvent.setup()
  const unwrap = vi.fn().mockResolvedValue({
    token: 'token',
    user: { id: 'u1', email: 'a@b.com' },
  })
  const loginMutation = vi.fn().mockReturnValue({ unwrap })
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    loginMutation,
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: {
              from: { pathname: '/chat', state: { draft: '想聊的内容' } },
            },
          },
        ]}
      >
        <LocationDisplay />
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )

  await user.type(screen.getByPlaceholderText('邮箱'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('密码'), 'secret123')
  await user.click(screen.getByRole('button', { name: '邮箱登录' }))

  const location = await screen.findByTestId('location-display')
  expect(location).toHaveTextContent('/chat')
  expect(location).toHaveAttribute('data-draft', '想聊的内容')
})

it('centers login content within the page', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  const container = screen.getByTestId('login-page')
  const card = screen.getByTestId('login-card')
  expect(container).toHaveClass('flex-1')
  expect(container).toHaveClass('items-center')
  expect(container).toHaveClass('justify-center')
  expect(card).toHaveClass('max-w-sm')
})

it('renders terms and privacy links', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useRegisterWithProfileMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(screen.getByRole('link', { name: '服务条款' })).toHaveAttribute('href', '/terms')
  expect(screen.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy')
})
