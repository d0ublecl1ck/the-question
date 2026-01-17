import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import MarketPage from './MarketPage'
import * as marketApi from '@/services/market'
import userEvent from '@testing-library/user-event'

it('renders market page sections', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([])
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('市场')).toBeInTheDocument()
  expect(screen.getByText('官方精选')).toBeInTheDocument()
  expect(screen.getByText('全部技能')).toBeInTheDocument()
})

it('loads market skills', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([])
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})

it('filters by search input', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([
    {
      id: 'skill-1',
      name: 'Alpha',
      description: 'First skill',
      tags: ['flow'],
      favorites_count: 0,
      rating: { average: 4.2, count: 10 },
      comments_count: 1,
    },
  ])
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )

  const input = await screen.findByPlaceholderText('搜索技能')
  await user.type(input, 'Beta')
  expect(await screen.findByText('无匹配结果')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '清除筛选' })).toBeInTheDocument()
})
