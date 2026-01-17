import type { MarketSkill } from '@/pages/MarketPage'

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
