import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import LibraryPage from './LibraryPage'
import * as marketService from '@/services/market'

it('renders library with empty state', async () => {
  vi.spyOn(marketService, 'fetchFavoriteSkills').mockResolvedValue([])
  vi.spyOn(marketService, 'fetchMarketSkillDetail').mockResolvedValue({
    id: 'skill-1',
    name: 'Alpha',
    description: 'First skill',
    tags: ['flow'],
    favorites_count: 0,
    rating: { average: 4.2, count: 10 },
    comments_count: 1,
  })
  render(<LibraryPage />)
  expect(await screen.findByText('暂无收藏技能')).toBeInTheDocument()
})
