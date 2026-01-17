import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import SkillSuggestionCard from './SkillSuggestionCard'

const mockSkill = {
  id: 'skill-1',
  name: 'write-paper',
  description: '用于撰写论文与结构化梳理',
  tags: ['论文', '写作'],
}

it('fires callbacks when actions are clicked', async () => {
  const user = userEvent.setup()
  const onUse = vi.fn()
  const onDismiss = vi.fn()
  const onReject = vi.fn()

  render(
    <SkillSuggestionCard
      skill={mockSkill}
      reason="论文写作"
      onUse={onUse}
      onDismiss={onDismiss}
      onReject={onReject}
    />,
  )

  expect(screen.getByText('推荐理由：论文写作')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '使用技能' }))
  await user.click(screen.getByRole('button', { name: '先不' }))
  await user.click(screen.getByRole('button', { name: '不再提示' }))

  expect(onUse).toHaveBeenCalledTimes(1)
  expect(onDismiss).toHaveBeenCalledTimes(1)
  expect(onReject).toHaveBeenCalledTimes(1)
})
