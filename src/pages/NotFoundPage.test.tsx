import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage'

it('renders not found page', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  )
  expect(screen.getByText('页面不存在')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '回到对话' })).toBeInTheDocument()
})
