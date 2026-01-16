import { create } from 'zustand'

type AuthUser = {
  id: string
  email: string
}

type AuthState = {
  status: 'anonymous' | 'authenticated'
  token?: string
  user?: AuthUser
  setAuth: (payload: { token: string; user: AuthUser }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'anonymous',
  token: undefined,
  user: undefined,
  setAuth: ({ token, user }) => set({ status: 'authenticated', token, user }),
  clearAuth: () => set({ status: 'anonymous', token: undefined, user: undefined }),
}))
