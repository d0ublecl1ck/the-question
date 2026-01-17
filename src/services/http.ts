import { useAuthStore } from '@/stores/authStore'

type FetchOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

export async function authFetch(path: string, options: FetchOptions = {}) {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(path, { ...options, headers })
}
