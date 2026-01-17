import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import LoginPage from './LoginPage'
import { store } from '@/store/appStore'
import { useLoginWithProfileMutation, useRegisterWithProfileMutation } from '@/store/api/authApi'

vi.mock('@/store/api/authApi', () => ({
  useLoginWithProfileMutation: vi.fn(),
  useRegisterWithProfileMutation: vi.fn(),
}))

it('renders login page', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
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

it('renders larger logo and brand styles', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
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
    { isLoading: false },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
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

it('centers login content within the page', () => {
  vi.mocked(useLoginWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
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
    { isLoading: false },
  ] as ReturnType<typeof useLoginWithProfileMutation>)
  vi.mocked(useRegisterWithProfileMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
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
