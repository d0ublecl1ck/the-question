export type ApiError = {
  status: number
  message: string
}

export type MarketSkill = {
  id: string
  name: string
  description: string
  tags: string[]
  visibility?: string
  avatar?: string | null
  favorites_count: number
  rating: { average: number; count: number }
  comments_count: number
  updated_at?: string
  favorited_at?: string
}

export type SearchSkill = {
  id: string
  name: string
  description: string
  tags: string[]
  visibility: string
  owner_id?: string | null
  created_at?: string
  updated_at?: string
}

export type MeProfile = {
  id: string
  email: string
  is_active: boolean
  role: string
}

export type MemoryItem = {
  id: string
  key: string
  value: string
  scope?: string | null
}

export type ChatSession = {
  id: string
  title?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  skill_id?: string | null
}

export type SkillItem = {
  id: string
  name: string
  description: string
  tags: string[]
}

export type SkillOut = {
  id: string
  name: string
  description: string
  tags: string[]
  visibility: string
  avatar?: string | null
  owner_id?: string | null
  created_at?: string
  updated_at?: string
  deleted?: boolean
  deleted_at?: string | null
}

export type SkillDetail = SkillOut & {
  latest_version: number
  content: string
}

export type AiModelOption = {
  id: string
  name: string
}
