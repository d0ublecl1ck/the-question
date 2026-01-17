import type { SearchSkill } from '@/pages/SearchPage'

export async function searchSkills(query: string): Promise<SearchSkill[]> {
  const response = await fetch(`/api/v1/search/skills?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json()
}
