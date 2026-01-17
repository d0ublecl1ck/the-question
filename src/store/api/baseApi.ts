import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../appStore'
import { clearAuth } from '../slices/authSlice'
import { enqueueToast } from '../slices/toastSlice'

let redirectedOnAuth = false

const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const authExemptPaths = new Set(['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'])

const getRequestPath = (input: string | FetchArgs) => {
  if (typeof input === 'string') return input
  return input.url
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error) {
    const path = getRequestPath(args)
    const isAuthExempt = authExemptPaths.has(path)
    if (result.error.status === 401) {
      if (!isAuthExempt) {
        api.dispatch(clearAuth())
        api.dispatch(enqueueToast('登录已过期，请重新登录'))
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
    } else {
      api.dispatch(enqueueToast('请求失败，请稍后重试'))
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'MarketSkills',
    'MarketSkill',
    'Favorites',
    'Me',
    'Memory',
    'ChatMessages',
    'ChatSessions',
    'Skills',
    'SkillSuggestions',
    'SkillDraftSuggestions',
    'SkillDetail',
    'AiModels',
  ],
  endpoints: () => ({}),
})
