import { baseApi } from './baseApi'
import type { MeProfile, MemoryItem } from './types'

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<MeProfile, void>({
      query: () => '/api/v1/me',
      providesTags: ['Me'],
    }),
    getMemory: build.query<MemoryItem[], { scope?: string | null }>({
      query: ({ scope }) => `/api/v1/me/memory?scope=${scope ?? 'user'}`,
      providesTags: ['Memory'],
    }),
    updateMe: build.mutation<MeProfile, { email: string }>({
      query: (payload) => ({
        url: '/api/v1/me',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Me'],
    }),
    updateMemory: build.mutation<unknown, { key: string; value: string; scope?: string | null }>({
      query: (payload) => ({
        url: '/api/v1/me/memory',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Memory'],
    }),
  }),
})

export const {
  useGetMeQuery,
  useGetMemoryQuery,
  useUpdateMeMutation,
  useUpdateMemoryMutation,
} = settingsApi
