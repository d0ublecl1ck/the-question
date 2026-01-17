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
    screen.getByRole('heading', { name: '让科技不再高高在上，真正服务每一个人' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Contact')).toBeInTheDocument()
})
