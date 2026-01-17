import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LibraryPage from './LibraryPage'
import { useGetFavoriteSkillDetailsQuery } from '@/store/api/marketApi'

vi.mock('@/store/api/marketApi', () => ({
  useGetFavoriteSkillDetailsQuery: vi.fn(),
}))

it('renders library headline', async () => {
  vi.mocked(useGetFavoriteSkillDetailsQuery).mockReturnValue({
    data: [
      {
        id: 'skill-1',
        name: 'Alpha',
        description: 'First skill',
        tags: ['flow'],
        favorites_count: 0,
        rating: { average: 4.2, count: 10 },
        comments_count: 1,
      },
    ],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetFavoriteSkillDetailsQuery>)
  render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: '技能库' })).toBeInTheDocument()
})

it('renders library with empty state', async () => {
  vi.mocked(useGetFavoriteSkillDetailsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetFavoriteSkillDetailsQuery>)
  render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  )
  expect(useGetFavoriteSkillDetailsQuery).toHaveBeenCalled()
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})
