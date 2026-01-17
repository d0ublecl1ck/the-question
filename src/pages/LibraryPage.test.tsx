import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LibraryPage from './LibraryPage'
import { useGetFavoriteSkillDetailsQuery } from '@/store/api/marketApi'

vi.mock('@/store/api/marketApi', () => ({
  useGetFavoriteSkillDetailsQuery: vi.fn(),
}))

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
  expect(await screen.findByText('暂无收藏技能')).toBeInTheDocument()
})
