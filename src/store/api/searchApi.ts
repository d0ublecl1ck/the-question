import { baseApi } from './baseApi'
import type { SearchSkill } from './types'

export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchSkills: build.query<SearchSkill[], string>({
      query: (query) => `/api/v1/search/skills?q=${encodeURIComponent(query)}`,
    }),
  }),
})

export const { useLazySearchSkillsQuery, useSearchSkillsQuery } = searchApi
