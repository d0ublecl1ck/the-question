import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import HomePage from './HomePage'

const LocationDisplay = () => {
  const location = useLocation()
  const draft = (location.state as { draft?: string } | null)?.draft ?? ''
  return (
    <div data-testid="location-display" data-draft={draft}>
      {location.pathname}
    </div>
  )
}

it('renders wen dui hero and avoids card wrappers', () => {
  const { container } = render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: '问对问题，遇见专家' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'AI 对话输入' })).toBeInTheDocument()
  expect(screen.getByText('为团队设计的对话式技能平台')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '鸣谢' })).toBeInTheDocument()
  expect(screen.getByTestId('acknowledgements-logo-cloud')).toBeInTheDocument()
  expect(container.querySelector('.page-card')).toBeNull()
  expect(screen.getByTestId('skill-hub-hero')).toHaveStyle({
    backgroundImage: expect.stringContaining('skill-hub-card'),
  })
})

it('disables send button when prompt is empty', () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )

  expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
})

it('navigates to chat with draft when clicking send', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/']}>
      <LocationDisplay />
      <HomePage />
    </MemoryRouter>,
  )

  await user.type(screen.getByRole('textbox', { name: 'AI 对话输入' }), '想聊的内容')
  await user.click(screen.getByRole('button', { name: '发送' }))

  const location = await screen.findByTestId('location-display')
  expect(location).toHaveTextContent('/chat')
  expect(location).toHaveAttribute('data-draft', '想聊的内容')
})
