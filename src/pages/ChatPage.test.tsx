import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi, beforeEach } from 'vitest'
import ChatPage from './ChatPage'
import { useAuthStore } from '@/stores/authStore'

beforeEach(() => {
  useAuthStore.setState({ status: 'authenticated', token: 'token', user: { id: 'u1', email: 'a@b.com' } })
})

it('renders chat page with composer', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.includes('/api/v1/chat/sessions')) {
      return new Response(JSON.stringify({ id: 's1', title: '对话' }), { status: 201 })
    }
    if (url.includes('/api/v1/skills')) {
      return new Response(
        JSON.stringify([{ id: 'skill-1', name: '需求澄清', description: 'desc', tags: ['tag'] }]),
        { status: 200 },
      )
    }
    if (url.includes('/api/v1/ai/models')) {
      return new Response(JSON.stringify([{ id: 'gpt-5.2-2025-12-11', label: 'GPT-5.2' }]), { status: 200 })
    }
    if (url.includes('/api/v1/chats/')) {
      return new Response(JSON.stringify([]), { status: 200 })
    }
    return new Response(JSON.stringify({}), { status: 200 })
  }))

  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('对话')).toBeInTheDocument()
  expect(await screen.findByPlaceholderText('输入内容，按 $ 触发技能选择')).toBeInTheDocument()
})

it('renders login entry when unauthenticated', () => {
  useAuthStore.setState({ status: 'anonymous', token: undefined, user: undefined })
  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>,
  )
  expect(screen.getByRole('button', { name: '去登录' })).toBeInTheDocument()
})
