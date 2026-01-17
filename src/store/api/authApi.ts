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
    loginWithProfile: build.mutation<
      { token: string; user: { id: string; email: string } },
      { email: string; password: string }
    >({
      async queryFn(payload, _api, _extraOptions, baseQuery) {
        const loginResult = await baseQuery({
          url: '/api/v1/auth/login',
          method: 'POST',
          body: payload,
        })
        if (loginResult.error) {
          return { error: loginResult.error }
        }
        const { access_token } = loginResult.data as { access_token: string }
        const meResult = await baseQuery({
          url: '/api/v1/me',
          headers: { Authorization: `Bearer ${access_token}` },
        })
        if (meResult.error) {
          return { error: meResult.error }
        }
        const user = meResult.data as { id: string; email: string }
        return { data: { token: access_token, user } }
      },
    }),
    registerWithProfile: build.mutation<
      { token: string; user: { id: string; email: string } },
      { email: string; password: string }
    >({
      async queryFn(payload, _api, _extraOptions, baseQuery) {
        const registerResult = await baseQuery({
          url: '/api/v1/auth/register',
          method: 'POST',
          body: payload,
        })
        if (registerResult.error) {
          return { error: registerResult.error }
        }
        const loginResult = await baseQuery({
          url: '/api/v1/auth/login',
          method: 'POST',
          body: payload,
        })
        if (loginResult.error) {
          return { error: loginResult.error }
        }
        const { access_token } = loginResult.data as { access_token: string }
        const meResult = await baseQuery({
          url: '/api/v1/me',
          headers: { Authorization: `Bearer ${access_token}` },
        })
        if (meResult.error) {
          return { error: meResult.error }
        }
        const user = meResult.data as { id: string; email: string }
        return { data: { token: access_token, user } }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLoginWithProfileMutation,
  useRegisterWithProfileMutation,
} = authApi
