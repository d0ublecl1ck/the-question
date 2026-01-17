import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import LoginPage from './LoginPage'

it('renders login page', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
  expect(screen.getByText('WenDui')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
  expect(screen.queryByText('通过 Google 登录')).not.toBeInTheDocument()
  expect(screen.queryByText('使用 Apple 登录')).not.toBeInTheDocument()
  expect(screen.queryByText('通过 Lark 登录')).not.toBeInTheDocument()
})

it('shows email validation error on submit', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByPlaceholderText('邮箱'), 'not-an-email')
  await user.type(screen.getByPlaceholderText('密码'), 'secret123')
  await user.click(screen.getByRole('button', { name: '邮箱登录' }))
  expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument()
})

it('centers login content within the page', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
  const container = screen.getByTestId('login-page')
  expect(container).toHaveClass('flex-1')
  expect(container).toHaveClass('items-center')
  expect(container).toHaveClass('justify-center')
})
