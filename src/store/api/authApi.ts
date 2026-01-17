import { baseApi } from './baseApi'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<{ access_token: string }, { email: string; password: string }>({
      query: (payload) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: payload,
      }),
    }),
    register: build.mutation<{ access_token?: string }, { email: string; password: string }>({
      query: (payload) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authApi
