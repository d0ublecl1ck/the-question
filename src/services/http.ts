import { store } from '@/store/appStore'
import { clearAuth } from '@/store/slices/authSlice'
import { enqueueToast } from '@/store/slices/toastSlice'

type FetchOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

let redirectedOnAuth = false

export async function authFetch(path: string, options: FetchOptions = {}) {
  const token = store.getState().auth.token
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401) {
    store.dispatch(clearAuth())
    store.dispatch(enqueueToast('登录已过期，请重新登录'))
    if (typeof window !== 'undefined' && !redirectedOnAuth) {
      redirectedOnAuth = true
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
      window.setTimeout(() => {
        redirectedOnAuth = false
      }, 2000)
    }
  }

  return response
}
