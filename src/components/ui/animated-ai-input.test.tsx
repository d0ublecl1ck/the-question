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
