import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import MarketPage from './MarketPage'
import { useGetMarketSkillsQuery } from '@/store/api/marketApi'

vi.mock('@/store/api/marketApi', () => ({
  useGetMarketSkillsQuery: vi.fn(),
}))

it('renders market page sections', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  expect(useGetMarketSkillsQuery).toHaveBeenCalled()
  expect(await screen.findByText('市场')).toBeInTheDocument()
  expect(screen.getByText('Highlights')).toBeInTheDocument()
  expect(screen.getByText('Categories')).toBeInTheDocument()
})

it('loads market skills', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  const placeholders = await screen.findAllByText('暂无内容')
  expect(placeholders).toHaveLength(2)
})

it('does not wrap sections in cards', async () => {
  vi.mocked(useGetMarketSkillsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillsQuery>)
  const { container } = render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  await screen.findByText('市场')
  expect(container.querySelector('.page-card')).toBeNull()
})
