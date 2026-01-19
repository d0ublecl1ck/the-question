import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Alert, AlertDescription } from './alert'

it('does not set role by default', () => {
  const { container } = render(
    <Alert>
      <span>内容</span>
    </Alert>,
  )
  const root = container.firstElementChild as HTMLElement | null
  expect(root).not.toBeNull()
  expect(root?.getAttribute('role')).toBeNull()
})

it('respects role prop when provided', () => {
  const { container } = render(
    <Alert role="alert">
      <span>内容</span>
    </Alert>,
  )
  const root = container.firstElementChild as HTMLElement | null
  expect(root).not.toBeNull()
  expect(root?.getAttribute('role')).toBe('alert')
})

it('renders AlertDescription as a div', () => {
  render(<AlertDescription>描述</AlertDescription>)
  const description = screen.getByText('描述')
  expect(description.tagName).toBe('DIV')
})
