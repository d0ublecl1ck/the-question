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

const STORAGE_KEY = 'skillchat_auth'

const loadAuth = (): { token?: string; user?: AuthUser } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as { token?: string; user?: AuthUser }
  } catch (error) {
    return {}
  }
}

const persistAuth = (payload: { token?: string; user?: AuthUser }) => {
  try {
    if (!payload.token || !payload.user) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    // ignore storage failures
  }
}

const initial = loadAuth()

export const useAuthStore = create<AuthState>((set) => ({
  status: initial.token ? 'authenticated' : 'anonymous',
  token: initial.token,
  user: initial.user,
  setAuth: ({ token, user }) => {
    persistAuth({ token, user })
    set({ status: 'authenticated', token, user })
  },
  clearAuth: () => {
    persistAuth({})
    set({ status: 'anonymous', token: undefined, user: undefined })
  },
}))
