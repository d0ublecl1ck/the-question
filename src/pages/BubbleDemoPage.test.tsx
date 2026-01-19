import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import BubbleDemoPage from './BubbleDemoPage'

it('renders bubble demo page', () => {
  render(<BubbleDemoPage />)
  expect(screen.getByRole('heading', { name: 'Bubble Demo' })).toBeInTheDocument()
  expect(
    screen.getByText('纯静态展示，覆盖当前所有气泡组合与 Markdown 渲染。'),
  ).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Markdown 支持' })).toBeInTheDocument()
  expect(screen.getByText(/用户也可以发送 Markdown/)).toBeInTheDocument()
  expect(screen.getByText('code')).toBeInTheDocument()
  expect(screen.getAllByText('强调').length).toBeGreaterThanOrEqual(2)
})
