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
        const favorites = (favoritesResult.data ?? []) as { skill_id: string; created_at?: string }[]
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
        const favoritesById = new Map(
          favorites.map((favorite) => [favorite.skill_id, favorite.created_at]),
        )
        return {
          data: detailResults.map((result) => {
            const skill = result.data as MarketSkill
            return {
              ...skill,
              favorited_at: favoritesById.get(skill.id),
            }
          }),
        }
      },
      providesTags: ['Favorites'],
    }),
    createFavorite: build.mutation<unknown, { skill_id: string }>({
      query: (payload) => ({
        url: '/api/v1/market/favorites',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Favorites', 'MarketSkill', 'MarketSkills'],
    }),
    deleteFavorite: build.mutation<unknown, { skill_id: string }>({
      query: ({ skill_id }) => ({
        url: `/api/v1/market/favorites/${skill_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites', 'MarketSkill', 'MarketSkills'],
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
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useCreateSkillReportMutation,
} = marketApi
