import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

it('renders a basic element', () => {
  render(<div>ok</div>)
  expect(screen.getByText('ok')).toBeInTheDocument()
})
