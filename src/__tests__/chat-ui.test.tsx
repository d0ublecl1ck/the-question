import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { expect, it, vi, beforeEach } from 'vitest'
import ChatPage from '../pages/ChatPage'
import { MemoryRouter } from 'react-router-dom'
import { store } from '@/store/appStore'
import { setAuth } from '@/store/slices/authSlice'

beforeEach(() => {
  store.dispatch(setAuth({ token: 'token', user: { id: 'u1', email: 'a@b.com' } }))
})

it('opens skill picker when pressing $', async () => {
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
  const user = userEvent.setup()
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </Provider>,
  )
  const input = screen.getByPlaceholderText(/输入内容/)
  await user.click(input)
  await user.keyboard('$')
  expect(await screen.findByRole('heading', { name: '选择技能' })).toBeInTheDocument()
})
