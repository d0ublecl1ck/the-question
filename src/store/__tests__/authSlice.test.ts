import { authReducer, setAuth } from '@/store/slices/authSlice'

test('sets authenticated state with token and user', () => {
  const state = authReducer(
    undefined,
    setAuth({
      token: 't',
      user: { id: '1', email: 'a@b.com' },
    }),
  )
  expect(state.status).toBe('authenticated')
  expect(state.token).toBe('t')
})
