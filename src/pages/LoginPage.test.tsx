import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import LoginPage from './LoginPage'

it('renders login page', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
  expect(screen.getByText('登录')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
})
