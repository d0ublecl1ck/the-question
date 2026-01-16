import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { AppProviders } from '../app/providers'

function Probe() {
  const client = useQueryClient()
  return <span>{client ? 'ok' : 'no'}</span>
}

it('provides a query client', () => {
  render(
    <AppProviders>
      <Probe />
    </AppProviders>,
  )
  expect(screen.getByText('ok')).toBeInTheDocument()
})
