import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage'
import { useGetMeQuery, useGetMemoryQuery } from '@/store/api/settingsApi'

vi.mock('@/store/api/settingsApi', () => ({
  useGetMeQuery: vi.fn(),
  useGetMemoryQuery: vi.fn(),
  useUpdateMeMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateMemoryMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

it('renders settings sections', async () => {
  vi.mocked(useGetMeQuery).mockReturnValue({
    data: { id: 'user-1', email: 'a@b.com', is_active: true, role: 'user' },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMeQuery>)
  vi.mocked(useGetMemoryQuery).mockReturnValue({
    data: [{ id: 'mem-1', key: 'profile', value: '偏好简洁', scope: 'user' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMemoryQuery>)

  render(<SettingsPage />)
  expect(await screen.findByText('账号信息')).toBeInTheDocument()
  expect(screen.getByText('偏好记忆')).toBeInTheDocument()
  expect(screen.getByText('默认技能')).toBeInTheDocument()
})

it('renders error state when loading fails', async () => {
  vi.mocked(useGetMeQuery).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
  } as ReturnType<typeof useGetMeQuery>)
  vi.mocked(useGetMemoryQuery).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetMemoryQuery>)

  render(<SettingsPage />)
  expect(await screen.findByText('加载失败，请稍后重试')).toBeInTheDocument()
})
