import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import MarketPage from './MarketPage'
import * as marketApi from '@/services/market'

it('renders market page sections', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([])
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('市场')).toBeInTheDocument()
  expect(screen.getByText('Highlights')).toBeInTheDocument()
  expect(screen.getByText('Categories')).toBeInTheDocument()
})

it('loads market skills', async () => {
  vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([])
  render(
    <MemoryRouter>
      <MarketPage />
    </MemoryRouter>,
  )
  const placeholders = await screen.findAllByText('暂无内容')
  expect(placeholders).toHaveLength(2)
})
