import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import HomePage from './HomePage'

it('renders wen dui hero and avoids card wrappers', () => {
  const { container } = render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: '问对问题，遇见专家' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'AI 对话输入' })).toBeInTheDocument()
  expect(screen.getByText('为团队设计的对话式技能平台')).toBeInTheDocument()
  expect(container.querySelector('.page-card')).toBeNull()
  expect(screen.getByTestId('skill-hub-hero')).toHaveStyle({
    backgroundImage: expect.stringContaining('skill-hub-card'),
  })
})
