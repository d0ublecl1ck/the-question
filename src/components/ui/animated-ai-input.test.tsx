import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { AI_Prompt } from './animated-ai-input'

const models = [{ id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', host: 'openai' }]

it('renders flat surface without background class', () => {
  render(
    <AI_Prompt
      value=""
      onChange={() => undefined}
      onSend={() => undefined}
      models={models}
      selectedModelId={models[0]?.id ?? null}
      onModelChange={() => undefined}
      surface="flat"
    />,
  )

  const textarea = screen.getByPlaceholderText('输入内容，回车发送')
  expect(textarea).toHaveClass('bg-transparent')
})

const minimaxModels = [
  { id: 'MiniMax-M2.1-lightning', name: 'MiniMax M2.1 Lightning', host: 'minimax' },
  { id: 'MiniMax-M2.1', name: 'MiniMax M2.1', host: 'minimax' },
  { id: 'MiniMax-M2', name: 'MiniMax M2', host: 'minimax' },
]

it.each(minimaxModels.map((model) => model.id))('renders MiniMax icon for %s model', (modelId) => {
  render(
    <AI_Prompt
      value=""
      onChange={() => undefined}
      onSend={() => undefined}
      models={minimaxModels}
      selectedModelId={modelId}
      onModelChange={() => undefined}
    />,
  )

  expect(screen.getByLabelText('MiniMax Icon')).toBeInTheDocument()
})

it('collapses textarea when collapsed is true', () => {
  render(
    <AI_Prompt
      value=""
      onChange={() => undefined}
      onSend={() => undefined}
      models={models}
      selectedModelId={models[0]?.id ?? null}
      onModelChange={() => undefined}
      collapsed
    />,
  )

  const textarea = screen.getByPlaceholderText('输入内容，回车发送')
  expect(textarea).toHaveClass('min-h-[40px]')
  expect(textarea).toHaveAttribute('rows', '1')
})
