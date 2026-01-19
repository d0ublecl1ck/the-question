import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ReportDialog from './ReportDialog'
import { useCreateSkillReportMutation } from '@/store/api/marketApi'

vi.mock('@/store/api/marketApi', () => ({
  useCreateSkillReportMutation: vi.fn(),
}))

it('submits report via mutation', async () => {
  const createReport = vi.fn().mockResolvedValue({})
  vi.mocked(useCreateSkillReportMutation).mockReturnValue([
    createReport,
    { isLoading: false, reset: vi.fn() },
  ] as ReturnType<typeof useCreateSkillReportMutation>)

  const user = userEvent.setup()
  render(<ReportDialog targetId="skill-1" targetName="Alpha" />)

  await user.click(screen.getByRole('button', { name: '举报' }))
  await user.type(await screen.findByPlaceholderText('问题摘要'), '质量问题')
  await user.type(screen.getByPlaceholderText('详细描述'), '描述细节')
  await user.click(screen.getByRole('button', { name: '提交举报' }))

  expect(createReport).toHaveBeenCalledWith({
    targetId: 'skill-1',
    title: '质量问题',
    content: '描述细节',
  })
})
