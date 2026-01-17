import { baseApi } from './baseApi'
import type { AiModelOption } from './types'

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAiModels: build.query<AiModelOption[], void>({
      query: () => '/api/v1/ai/models',
      providesTags: ['AiModels'],
    }),
  }),
})

export const { useListAiModelsQuery } = aiApi
