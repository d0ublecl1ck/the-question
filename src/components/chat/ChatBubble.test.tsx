import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ChatBubble from './ChatBubble'

const BASE64_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/aaZ0iQAAAAASUVORK5CYII='

it('renders plain text bubble', () => {
  render(<ChatBubble role="assistant" content="hello world" />)
  expect(screen.getByText('hello world')).toBeInTheDocument()
})

it('renders markdown base64 image inside content', () => {
  render(<ChatBubble role="assistant" content={`before\n![alt](${BASE64_IMAGE})\nafter`} />)
  const image = screen.getByRole('img', { name: 'alt' })
  expect(image).toHaveAttribute('src', BASE64_IMAGE)
  expect(screen.getByText('before')).toBeInTheDocument()
  expect(screen.getByText('after')).toBeInTheDocument()
})

it('uses shrink-to-content layout for different roles', () => {
  const { rerender } = render(<ChatBubble role="assistant" content="assistant" />)
  const assistantBubble = screen.getByText('assistant').parentElement
  expect(assistantBubble).toHaveClass('inline-flex')
  expect(assistantBubble).toHaveClass('self-start')

  rerender(<ChatBubble role="user" content="user" />)
  const userBubble = screen.getByText('user').parentElement
  expect(userBubble).toHaveClass('inline-flex')
  expect(userBubble).toHaveClass('self-end')
})

it('renders clarification chain when marker is present', () => {
  const content = `前置文本
&lt;!-- Clarification chain --&gt;
\`\`\`json
{
  "clarify_chain": [
    {
      "type": "single_choice",
      "question": "预算是硬性约束吗？",
      "choices": ["是", "否", "其他"]
    },
    {
      "type": "ranking",
      "question": "请按重要性排序：",
      "options": ["越野性能", "乘坐舒适", "油耗", "价格"]
    },
    {
      "type": "free_text",
      "question": "补充说明"
    }
  ]
}
\`\`\``
  render(<ChatBubble role="assistant" content={content} />)
  expect(screen.getByText('预算是硬性约束吗？')).toBeInTheDocument()
  expect(screen.getByText('请按重要性排序：')).toBeInTheDocument()
  expect(screen.getByText('补充说明')).toBeInTheDocument()
  expect(screen.getByText('越野性能')).toBeInTheDocument()
})
