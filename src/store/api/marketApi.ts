import { baseApi } from './baseApi'
import type { MarketSkill } from './types'

export const marketApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMarketSkills: build.query<MarketSkill[], void>({
      query: () => '/api/v1/market/skills',
      providesTags: ['MarketSkills'],
    }),
    getMarketSkillDetail: build.query<MarketSkill, string>({
      query: (skillId) => `/api/v1/market/skills/${skillId}`,
      providesTags: (_result, _error, skillId) => [{ type: 'MarketSkill', id: skillId }],
    }),
    getFavoriteSkills: build.query<{ skill_id: string }[], void>({
      query: () => '/api/v1/market/favorites',
      providesTags: ['Favorites'],
    }),
    getFavoriteSkillDetails: build.query<MarketSkill[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const favoritesResult = await baseQuery('/api/v1/market/favorites')
        if (favoritesResult.error) {
          return { error: favoritesResult.error }
        }
        const favorites = (favoritesResult.data ?? []) as { skill_id: string }[]
        if (favorites.length === 0) {
          return { data: [] }
        }
        const detailResults = await Promise.all(
          favorites.map((item) => baseQuery(`/api/v1/market/skills/${item.skill_id}`)),
        )
        const firstError = detailResults.find((result) => result.error)
        if (firstError?.error) {
          return { error: firstError.error }
        }
        return { data: detailResults.map((result) => result.data as MarketSkill) }
      },
      providesTags: ['Favorites'],
    }),
    createSkillReport: build.mutation<unknown, { targetId: string; title: string; content: string }>({
      query: ({ targetId, title, content }) => ({
        url: '/api/v1/reports',
        method: 'POST',
        body: {
          target_type: 'skill',
          target_id: targetId,
          title,
          content,
        },
      }),
    }),
  }),
})

export const {
  useGetMarketSkillsQuery,
  useGetMarketSkillDetailQuery,
  useGetFavoriteSkillsQuery,
  useGetFavoriteSkillDetailsQuery,
  useCreateSkillReportMutation,
} = marketApi
