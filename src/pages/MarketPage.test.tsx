import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import MarketPage from './MarketPage'
import {
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useGetFavoriteSkillsQuery,
  useGetMarketSkillsQuery,
} from '@/store/api/marketApi'
import { store } from '@/store/appStore'
import { clearAuth, setAuth } from '@/store/slices/authSlice'

vi.mock('@/store/api/marketApi', () => ({
  useGetMarketSkillsQuery: vi.fn(),
  useGetFavoriteSkillsQuery: vi.fn(),
  useCreateFavoriteMutation: vi.fn(),
  useDeleteFavoriteMutation: vi.fn(),
}))

beforeEach(() => {
  store.dispatch(clearAuth())
  vi.mocked(useGetFavoriteSkillsQuery).mockReturnValue({
    data: [],
  } as ReturnType<typeof useGetFavoriteSkillsQuery>)
  vi.mocked(useCreateFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useCreateFavoriteMutation>)
  vi.mocked(useDeleteFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useDeleteFavoriteMutation>)
})

it('renders market page sections', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(useGetMarketSkillsQuery).toHaveBeenCalled()
  expect(await screen.findByRole('heading', { name: '社区' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '社区' })).toHaveAttribute('href', '/market')
  expect(screen.getByRole('link', { name: '我的' })).toHaveAttribute('href', '/library')
  expect(screen.getByText('标签')).toBeInTheDocument()
  expect(screen.getByText('排序')).toBeInTheDocument()
  expect(screen.getByText('专家列表')).toBeInTheDocument()
})

it('loads market skills', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  vi.mocked(useGetFavoriteSkillsQuery).mockReturnValue({
    data: [],
  } as ReturnType<typeof useGetFavoriteSkillsQuery>)
  vi.mocked(useCreateFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useCreateFavoriteMutation>)
  vi.mocked(useDeleteFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useDeleteFavoriteMutation>)
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    </Provider>,
  )
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})

it('does not wrap sections in cards', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  vi.mocked(useGetFavoriteSkillsQuery).mockReturnValue({
    data: [],
  } as ReturnType<typeof useGetFavoriteSkillsQuery>)
  vi.mocked(useCreateFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useCreateFavoriteMutation>)
  vi.mocked(useDeleteFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useDeleteFavoriteMutation>)
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    </Provider>,
  )
  await screen.findByRole('heading', { name: '社区' })
  expect(container.querySelector('.page-card')).toBeNull()
})

it('redirects to login with toast when clicking 我的 while anonymous', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  vi.mocked(useGetFavoriteSkillsQuery).mockReturnValue({
    data: [],
  } as ReturnType<typeof useGetFavoriteSkillsQuery>)
  vi.mocked(useCreateFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useCreateFavoriteMutation>)
  vi.mocked(useDeleteFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useDeleteFavoriteMutation>)
  const initialToastCount = store.getState().toast.toasts.length
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/market']}>
        <Routes>
          <Route path="/market" element={<MarketPage />} />
          <Route path="/login" element={<div>登录页</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  fireEvent.click(screen.getByRole('link', { name: '我的' }))
  expect(await screen.findByText('登录页')).toBeInTheDocument()
  const toasts = store.getState().toast.toasts
  expect(toasts.length).toBeGreaterThan(initialToastCount)
  expect(toasts.some((toast) => toast.message === '本功能登录才可以使用')).toBe(true)
})

it('creates favorite when clicking 收藏 while authenticated', async () => {
  const triggerCreate = vi.fn(() => ({ unwrap: () => Promise.resolve() }))
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [
      {
        id: 'skill-1',
        name: 'Skill One',
        description: 'Desc',
        tags: ['tag1'],
        visibility: 'public',
        avatar: null,
        favorites_count: 0,
        rating: { average: 0, count: 0 },
        comments_count: 0,
      },
    ],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  vi.mocked(useGetFavoriteSkillsQuery).mockReturnValue({
    data: [],
  } as ReturnType<typeof useGetFavoriteSkillsQuery>)
  vi.mocked(useCreateFavoriteMutation).mockReturnValue([triggerCreate, {}] as ReturnType<typeof useCreateFavoriteMutation>)
  vi.mocked(useDeleteFavoriteMutation).mockReturnValue([vi.fn(), {}] as ReturnType<typeof useDeleteFavoriteMutation>)
  store.dispatch(
    setAuth({
      token: 'token',
      user: { id: 'user-1', email: 'user@test.local' },
    }),
  )
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    </Provider>,
  )
  fireEvent.click(screen.getByRole('button', { name: /收藏技能/ }))
  await waitFor(() => {
    expect(triggerCreate).toHaveBeenCalledWith({ skill_id: 'skill-1' })
  })
})
