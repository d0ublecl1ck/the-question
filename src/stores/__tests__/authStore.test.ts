import { expect, it } from 'vitest'
import { useAuthStore } from '../authStore'

it('starts unauthenticated', () => {
  const state = useAuthStore.getState()
  expect(state.status).toBe('anonymous')
})

it('sets and clears auth state', () => {
  useAuthStore.getState().setAuth({
    token: 't',
    user: { id: 'u1', email: 'a@b.com' },
  })
  expect(useAuthStore.getState().status).toBe('authenticated')
  useAuthStore.getState().clearAuth()
  expect(useAuthStore.getState().status).toBe('anonymous')
})
