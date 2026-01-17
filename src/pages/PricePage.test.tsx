import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import PricePage from './PricePage'

it('renders pricing direction content', () => {
  render(
    <MemoryRouter>
      <PricePage />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: '未来可能的收费方式' })).toBeInTheDocument()
  expect(screen.getByText('社区专家分享收费')).toBeInTheDocument()
  expect(screen.getByText('订阅收费')).toBeInTheDocument()
})
