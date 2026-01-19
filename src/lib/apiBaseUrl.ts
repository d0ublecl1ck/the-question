type ApiEnv = {
  DEV?: boolean
  PROD?: boolean
  VITE_BACKEND_URL?: string
}

export const DEFAULT_DEV_BASE_URL = 'http://127.0.0.1:8000'

export const getApiBaseUrl = (env: ApiEnv = import.meta.env) => {
  if (typeof env.VITE_BACKEND_URL === 'string') {
    return env.VITE_BACKEND_URL
  }

  if (env.DEV) {
    return DEFAULT_DEV_BASE_URL
  }

  return ''
}
