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
  expect(screen.getByRole('link', { name: '开始体验' })).toBeInTheDocument()
  expect(screen.getByText('为团队设计的对话式技能平台')).toBeInTheDocument()
  expect(container.querySelector('.page-card')).toBeNull()
})
