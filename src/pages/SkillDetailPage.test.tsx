import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import SkillDetailPage from './SkillDetailPage'
import { useCreateSkillReportMutation, useGetMarketSkillDetailQuery } from '@/store/api/marketApi'

vi.mock('@/store/api/marketApi', () => ({
  useCreateSkillReportMutation: vi.fn(),
  useGetMarketSkillDetailQuery: vi.fn(),
}))

it('renders report entry', async () => {
  vi.mocked(useGetMarketSkillDetailQuery).mockReturnValue({
    data: {
      id: 'skill-1',
      name: 'Alpha',
      description: 'First skill',
      tags: ['flow'],
      favorites_count: 0,
      rating: { average: 4.2, count: 10 },
      comments_count: 1,
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMarketSkillDetailQuery>)
  vi.mocked(useCreateSkillReportMutation).mockReturnValue([
    vi.fn().mockResolvedValue({}),
    { isLoading: false },
  ] as ReturnType<typeof useCreateSkillReportMutation>)

  render(
    <MemoryRouter initialEntries={['/skills/skill-1']}>
      <Routes>
        <Route path="/skills/:id" element={<SkillDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(useGetMarketSkillDetailQuery).toHaveBeenCalled()
  expect(await screen.findByText('举报')).toBeInTheDocument()
  expect(screen.getByText('Skill Detail')).toBeInTheDocument()
  expect(screen.getAllByText('技能概览').length).toBeGreaterThan(0)
  expect(screen.getByText('收藏技能')).toBeInTheDocument()
})
