import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import MarketPage from './MarketPage'
import { useGetMarketSkillsQuery } from '@/store/api/marketApi'
import { store } from '@/store/appStore'
import { clearAuth } from '@/store/slices/authSlice'

vi.mock('@/store/api/marketApi', () => ({
  useGetMarketSkillsQuery: vi.fn(),
}))

beforeEach(() => {
  store.dispatch(clearAuth())
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
  expect(await screen.findByRole('heading', { name: '市场' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '市场' })).toHaveAttribute('href', '/market')
  expect(screen.getByRole('link', { name: '我的' })).toHaveAttribute('href', '/library')
  expect(screen.getByText('分类')).toBeInTheDocument()
  expect(screen.getByText('排序')).toBeInTheDocument()
  expect(screen.getByText('技能列表')).toBeInTheDocument()
})

it('loads market skills', async () => {
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
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})

it('does not wrap sections in cards', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    </Provider>,
  )
  await screen.findByRole('heading', { name: '市场' })
  expect(container.querySelector('.page-card')).toBeNull()
})

it('redirects to login with toast when clicking 我的 while anonymous', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
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
