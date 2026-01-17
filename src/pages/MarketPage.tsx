import { useEffect, useMemo, useState } from 'react'
import MarketFeatured from '@/components/market/MarketFeatured'
import MarketList from '@/components/market/MarketList'
import MarketTable from '@/components/market/MarketTable'
import MarketToolbar from '@/components/market/MarketToolbar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { fetchMarketSkills } from '@/services/market'

export type MarketSkill = {
  id: string
  name: string
  description: string
  tags: string[]
  favorites_count: number
  rating: { average: number; count: number }
  comments_count: number
  updated_at?: string
}

export default function MarketPage() {
  const [view, setView] = useState<'list' | 'table'>('list')
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState<'recent' | 'rating' | 'favorites'>('recent')

  const [skills, setSkills] = useState<MarketSkill[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setStatus('loading')
      try {
        const data = await fetchMarketSkills()
        if (!alive) return
        setSkills(data)
        setStatus('ready')
      } catch (error) {
        if (!alive) return
        setStatus('error')
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const featured = useMemo(() => skills.slice(0, 4), [skills])

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    skills.forEach((skill) => skill.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [skills])

  const filteredSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matchQuery = (skill: MarketSkill) =>
      !normalized ||
      skill.name.toLowerCase().includes(normalized) ||
      skill.description.toLowerCase().includes(normalized) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(normalized))
    const matchTags = (skill: MarketSkill) =>
      selectedTags.length === 0 || selectedTags.every((tag) => skill.tags.includes(tag))
    const list = skills.filter((skill) => matchQuery(skill) && matchTags(skill))

    if (sort === 'rating') {
      return list.toSorted((a, b) => b.rating.average - a.rating.average)
    }
    if (sort === 'favorites') {
      return list.toSorted((a, b) => b.favorites_count - a.favorites_count)
    }
    return list
  }, [query, selectedTags, skills, sort])

  return (
    <section className="space-y-8 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Market</p>
        <h2 className="text-3xl font-semibold">市场</h2>
        <p className="text-sm text-muted-foreground">
          官方技能与社区生态的入口。发现可复用流程并快速进入详情。
        </p>
      </header>

      <MarketToolbar
        query={query}
        onQueryChange={setQuery}
        tags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={(tag) =>
          setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
        }
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">官方精选</h3>
        </div>
        <MarketFeatured items={featured} />
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">全部技能</h3>
          <span className="text-xs text-muted-foreground">{filteredSkills.length} 项</span>
        </div>
        {status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            加载失败，请稍后重试
          </div>
        ) : filteredSkills.length === 0 && (query.trim() || selectedTags.length > 0) ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            <div>无匹配结果</div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setQuery('')
                setSelectedTags([])
              }}
            >
              清除筛选
            </Button>
          </div>
        ) : view === 'list' ? (
          <MarketList items={filteredSkills} />
        ) : (
          <MarketTable items={filteredSkills} />
        )}
      </section>
    </section>
  )
}
