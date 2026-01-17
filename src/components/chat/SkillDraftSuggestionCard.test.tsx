import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import SkillDraftSuggestionCard from './SkillDraftSuggestionCard'

it('renders skill draft suggestion card', () => {
  render(
    <SkillDraftSuggestionCard
      goal="市场规模分析流程"
      constraints="中国/B2C/未来3年"
      reason="流程可复用"
      onAccept={() => {}}
      onDismiss={() => {}}
      onReject={() => {}}
    />,
  )
  expect(screen.getByText('把这段流程沉淀成技能？')).toBeInTheDocument()
  expect(screen.getByText('市场规模分析流程')).toBeInTheDocument()
  expect(screen.getByText('中国/B2C/未来3年')).toBeInTheDocument()
  expect(screen.getByText('推荐理由：流程可复用')).toBeInTheDocument()
})
