import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = {
  id: string
  email: string
}

export type AuthState = {
  status: 'anonymous' | 'authenticated'
  token?: string
  user?: AuthUser
}

const STORAGE_KEY = 'skillchat_auth'

const loadAuth = (): { token?: string; user?: AuthUser } => {
  try {
    if (typeof window === 'undefined') return {}
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as { token?: string; user?: AuthUser }
  } catch {
    return {}
  }
}

const persistAuth = (payload: { token?: string; user?: AuthUser }) => {
  try {
    if (typeof window === 'undefined') return
    if (!payload.token || !payload.user) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

const initial = loadAuth()

const initialState: AuthState = {
  status: initial.token ? 'authenticated' : 'anonymous',
  token: initial.token,
  user: initial.user,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      persistAuth(action.payload)
      state.status = 'authenticated'
      state.token = action.payload.token
      state.user = action.payload.user
    },
    clearAuth: (state) => {
      persistAuth({})
      state.status = 'anonymous'
      state.token = undefined
      state.user = undefined
    },
  },
})

export const { setAuth, clearAuth } = authSlice.actions

export const authReducer = authSlice.reducer
