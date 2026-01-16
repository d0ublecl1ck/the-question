import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import ChatPage from '../pages/ChatPage'

it('opens skill picker when pressing $', async () => {
  const user = userEvent.setup()
  render(<ChatPage />)
  const input = screen.getByPlaceholderText(/输入内容/)
  await user.click(input)
  await user.keyboard('$')
  expect(await screen.findByRole('heading', { name: '选择技能' })).toBeInTheDocument()
})
