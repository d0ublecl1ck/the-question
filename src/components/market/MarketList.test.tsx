import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import MarketList from './MarketList'
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

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

it('navigates to skill detail when list item is clicked', () => {
  render(
    <MemoryRouter initialEntries={['/market']}>
      <LocationDisplay />
      <Routes>
        <Route
          path="/market"
          element={
            <>
              <MarketList items={[baseSkill]} />
            </>
          }
        />
        <Route path="/skills/:id" element={<div>detail</div>} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('link', { name: '查看技能 Skill One' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
})
