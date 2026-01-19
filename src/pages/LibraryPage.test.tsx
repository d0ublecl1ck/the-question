import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import LibraryPage from './LibraryPage'
import { useGetFavoriteSkillDetailsQuery } from '@/store/api/marketApi'
import { useGetMeQuery } from '@/store/api/settingsApi'
import { useListSkillsQuery } from '@/store/api/skillsApi'
import { store } from '@/store/appStore'

vi.mock('@/store/api/marketApi', () => ({
  useGetFavoriteSkillDetailsQuery: vi.fn(),
  useDeleteFavoriteMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))
vi.mock('@/store/api/settingsApi', () => ({
  useGetMeQuery: vi.fn(),
}))
vi.mock('@/store/api/skillsApi', () => ({
  useListSkillsQuery: vi.fn(),
  useDeleteSkillMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))
vi.mock('@/components/library/SkillFormDialog', () => ({
  default: ({ triggerLabel }: { triggerLabel: string }) => <button>{triggerLabel}</button>,
}))
vi.mock('@/components/library/SkillImportDialog', () => ({
  default: ({ triggerLabel }: { triggerLabel: string }) => <button>{triggerLabel}</button>,
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
    refetch: vi.fn(),
  } as ReturnType<typeof useGetFavoriteSkillDetailsQuery>)
  vi.mocked(useGetMeQuery).mockReturnValue({
    data: { id: 'user-1', email: 'a@b.com', is_active: true, role: 'user' },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useGetMeQuery>)
  vi.mocked(useListSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillsQuery>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LibraryPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(await screen.findByRole('heading', { name: '智囊团' })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: '收藏' }).length).toBeGreaterThan(0)
  expect(screen.getByRole('button', { name: '我创建的' })).toBeInTheDocument()
})

it('renders library with empty state', async () => {
  vi.mocked(useGetFavoriteSkillDetailsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useGetFavoriteSkillDetailsQuery>)
  vi.mocked(useGetMeQuery).mockReturnValue({
    data: { id: 'user-1', email: 'a@b.com', is_active: true, role: 'user' },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useGetMeQuery>)
  vi.mocked(useListSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useListSkillsQuery>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LibraryPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(useGetFavoriteSkillDetailsQuery).toHaveBeenCalled()
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})
