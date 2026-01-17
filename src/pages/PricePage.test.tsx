import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import PricePage from './PricePage'

it('renders pricing headline and cards', () => {
  render(
    <MemoryRouter>
      <PricePage />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: '为不同规模团队准备的方案' })).toBeInTheDocument()
  expect(screen.getAllByText('Pricing').length).toBeGreaterThan(0)
  expect(screen.getByText('Startup')).toBeInTheDocument()
})
