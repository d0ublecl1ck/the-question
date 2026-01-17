import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import SkillDetailPage from './SkillDetailPage'
import * as marketApi from '@/services/market'

it('renders report entry', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkillDetail').mockResolvedValue({
    id: 'skill-1',
    name: 'Alpha',
    description: 'First skill',
    tags: ['flow'],
    favorites_count: 0,
    rating: { average: 4.2, count: 10 },
    comments_count: 1,
  })

  render(
    <MemoryRouter initialEntries={['/skills/skill-1']}>
      <Routes>
        <Route path="/skills/:id" element={<SkillDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(await screen.findByText('举报')).toBeInTheDocument()
})
