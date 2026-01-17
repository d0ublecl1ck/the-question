import type { MarketSkill } from '@/pages/MarketPage'
import { authFetch } from '@/services/http'

export async function fetchMarketSkills(): Promise<MarketSkill[]> {
  const response = await fetch('/api/v1/market/skills')
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function fetchMarketSkillDetail(skillId: string): Promise<MarketSkill> {
  const response = await fetch(`/api/v1/market/skills/${skillId}`)
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}

export async function fetchFavoriteSkills(): Promise<{ skill_id: string }[]> {
  const response = await authFetch('/api/v1/market/favorites')
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}
