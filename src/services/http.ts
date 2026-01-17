import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

type FetchOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

let redirectedOnAuth = false

export async function authFetch(path: string, options: FetchOptions = {}) {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401) {
    useAuthStore.getState().clearAuth()
    useToastStore.getState().push('登录已过期，请重新登录')
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
