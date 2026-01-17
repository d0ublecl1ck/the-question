import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SearchPage from './SearchPage'
import * as searchService from '@/services/search'

it('renders search page and results', async () => {
  vi.spyOn(searchService, 'searchSkills').mockResolvedValue([
    {
      id: 'skill-1',
      name: '日报总结',
      description: '快速生成日报',
      tags: ['work'],
      visibility: 'public',
    },
  ])
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  )

  const input = screen.getByPlaceholderText('搜索技能，例如：日报总结')
  await user.type(input, '日报')
  await user.click(screen.getByRole('button', { name: '搜索' }))

  expect(await screen.findByText('搜索结果')).toBeInTheDocument()
  expect(await screen.findByText('日报总结')).toBeInTheDocument()
})
