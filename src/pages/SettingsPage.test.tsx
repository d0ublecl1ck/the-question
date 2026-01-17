import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage'

it('renders settings sections', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.endsWith('/api/v1/me')) {
      return new Response(
        JSON.stringify({ id: 'user-1', email: 'a@b.com', is_active: true, role: 'user' }),
        { status: 200 },
      )
    }
    if (url.includes('/api/v1/me/memory')) {
      return new Response(
        JSON.stringify([{ id: 'mem-1', key: 'profile', value: '偏好简洁', scope: 'user' }]),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify({}), { status: 200 })
  }))

  render(<SettingsPage />)
  expect(await screen.findByText('账号信息')).toBeInTheDocument()
  expect(screen.getByText('偏好记忆')).toBeInTheDocument()
  expect(screen.getByText('默认技能')).toBeInTheDocument()
})
