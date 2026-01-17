import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import MarketTable from './MarketTable'
import type { MarketSkill } from '@/store/api/types'

const baseSkill: MarketSkill = {
  id: 'skill-1',
  name: 'Skill One',
  description: 'Desc',
  tags: ['tag1'],
  visibility: 'public',
  avatar: null,
  favorites_count: 0,
  rating: { average: 0, count: 0 },
  comments_count: 0,
}

it('renders avatar cover when provided', () => {
  const items: MarketSkill[] = [
    {
      ...baseSkill,
      avatar: 'data:image/png;base64,AAA',
    },
  ]
  render(
    <MemoryRouter>
      <MarketTable items={items} />
    </MemoryRouter>,
  )
  const img = screen.getByRole('img', { name: 'Skill One cover' })
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', 'data:image/png;base64,AAA')
})

it('renders rating value and count', () => {
  const items: MarketSkill[] = [
    {
      ...baseSkill,
      rating: { average: 4.5, count: 12 },
    },
  ]
  render(
    <MemoryRouter>
      <MarketTable items={items} />
    </MemoryRouter>,
  )
  expect(screen.getByText('评分')).toBeInTheDocument()
  expect(screen.getByText('4.5')).toBeInTheDocument()
  expect(screen.getByText('(12)')).toBeInTheDocument()
})
