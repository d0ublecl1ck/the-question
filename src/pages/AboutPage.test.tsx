import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import AboutPage from './AboutPage'

it('renders about headline and contact section', () => {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole('heading', { name: '我们在构建面向团队的对话式技能平台' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Contact')).toBeInTheDocument()
})
