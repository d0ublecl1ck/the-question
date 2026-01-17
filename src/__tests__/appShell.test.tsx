import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it } from 'vitest'
import AppShell from '../components/AppShell'

it('renders the product brand name', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByText('\u95ee\u5bf9 \u00b7 WenDui')).toBeInTheDocument()
})
