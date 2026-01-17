import { baseApi } from './baseApi'
import type { SkillDetail, SkillOut } from './types'

type ListSkillsParams = {
  q?: string
  visibility?: string
  tags?: string[]
  owner_id?: string
  limit?: number
  offset?: number
}

type SkillCreatePayload = {
  name: string
  description: string
  visibility: string
  tags: string[]
  avatar?: string | null
  content: string
}

type SkillUpdatePayload = {
  skillId: string
  name?: string
  description?: string
  visibility?: string
  tags?: string[]
  avatar?: string | null
}

type SkillVersionPayload = {
  skillId: string
  content: string
  parent_version_id?: string | null
}

type SkillImportPayload = {
  name: string
  description: string
  visibility: string
  tags: string[]
  content: string
  versions?: Array<{
    version?: number | null
    content: string
    created_by?: string | null
    parent_version_id?: string | null
  }>
}

export const skillsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSkills: build.query<SkillOut[], ListSkillsParams | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.q) search.set('q', params.q)
        if (params?.visibility) search.set('visibility', params.visibility)
        if (params?.owner_id) search.set('owner_id', params.owner_id)
        if (params?.tags?.length) search.set('tags', params.tags.join(','))
        if (typeof params?.limit === 'number') search.set('limit', params.limit.toString())
        if (typeof params?.offset === 'number') search.set('offset', params.offset.toString())
        const query = search.toString()
        return `/api/v1/skills${query ? `?${query}` : ''}`
      },
      providesTags: ['Skills'],
    }),
    getSkillDetail: build.query<SkillDetail, string>({
      query: (skillId) => `/api/v1/skills/${skillId}`,
      providesTags: (_result, _error, skillId) => [{ type: 'SkillDetail', id: skillId }],
    }),
    createSkill: build.mutation<SkillDetail, SkillCreatePayload>({
      query: (payload) => ({
        url: '/api/v1/skills',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Skills'],
    }),
    updateSkill: build.mutation<SkillOut, SkillUpdatePayload>({
      query: ({ skillId, ...payload }) => ({
        url: `/api/v1/skills/${skillId}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { skillId }) => [
        'Skills',
        { type: 'SkillDetail', id: skillId },
      ],
    }),
    deleteSkill: build.mutation<{ status: string; deleted_at?: string }, string>({
      query: (skillId) => ({
        url: `/api/v1/skills/${skillId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Skills'],
    }),
    createVersion: build.mutation<unknown, SkillVersionPayload>({
      query: ({ skillId, ...payload }) => ({
        url: `/api/v1/skills/${skillId}/versions`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { skillId }) => [
        'Skills',
        { type: 'SkillDetail', id: skillId },
      ],
    }),
    importSkill: build.mutation<SkillDetail, SkillImportPayload>({
      query: (payload) => ({
        url: '/api/v1/skills/import',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Skills'],
    }),
  }),
})

export const {
  useListSkillsQuery,
  useGetSkillDetailQuery,
  useLazyGetSkillDetailQuery,
  useCreateSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
  useCreateVersionMutation,
  useImportSkillMutation,
} = skillsApi
