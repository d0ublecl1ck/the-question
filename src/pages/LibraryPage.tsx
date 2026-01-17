import { useMemo, useState } from 'react'
import { useGetFavoriteSkillDetailsQuery } from '@/store/api/marketApi'
import type { MarketSkill } from '@/store/api/types'
import MarketToolbar from '@/components/market/MarketToolbar'
import MarketList from '@/components/market/MarketList'
import MarketTable from '@/components/market/MarketTable'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function LibraryPage() {
  const { data: items = [], isLoading, isError } = useGetFavoriteSkillDetailsQuery()
  const status: 'loading' | 'ready' | 'error' = isError ? 'error' : isLoading ? 'loading' : 'ready'
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sort, setSort] = useState<'recent' | 'rating' | 'favorites'>('recent')

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((skill) =>
      skill.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    )
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .toSorted((a, b) => b.count - a.count)
  }, [items])

  const tags = useMemo(() => categories.map((item) => item.tag), [categories])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredItems = items.filter((skill) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.description.toLowerCase().includes(normalizedQuery) ||
        skill.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => skill.tags.includes(tag))
      return matchesQuery && matchesTags
    })

    const sorters: Record<typeof sort, (items: MarketSkill[]) => MarketSkill[]> = {
      recent: (list) =>
        list.toSorted((a, b) => {
          const aTime = a.updated_at ? Date.parse(a.updated_at) : 0
          const bTime = b.updated_at ? Date.parse(b.updated_at) : 0
          return bTime - aTime
        }),
      rating: (list) => list.toSorted((a, b) => b.rating.average - a.rating.average),
      favorites: (list) => list.toSorted((a, b) => b.favorites_count - a.favorites_count),
    }

    return sorters[sort](filteredItems)
  }, [items, query, selectedTags, sort])

  const selectedSummary =
    selectedTags.length === 0 ? '全部标签' : `已选 ${selectedTags.length} 个标签`

  const renderLibraryActions = (item: MarketSkill) => (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="rounded-full">
        <Link to={`/skills/${item.id}`}>查看</Link>
      </Button>
      <Button variant="outline" size="sm" className="rounded-full" disabled>
        编辑
      </Button>
      <Button variant="outline" size="sm" className="rounded-full" disabled>
        删除
      </Button>
    </div>
  )

  return (
    <section className="w-full space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Library</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">技能库</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              管理收藏与自建技能，支持检索、筛选与多视图浏览。
            </p>
          </div>
          <span className="rounded-full border border-border/60 bg-white/80 px-4 py-2 text-xs text-muted-foreground shadow-sm">
            {selectedSummary}
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-3 backdrop-blur">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">标签</span>
          <Button
            variant={selectedTags.length === 0 ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedTags([])}
          >
            全部
          </Button>
          {categories.length === 0 ? (
            <span className="text-xs text-muted-foreground">暂无标签</span>
          ) : (
            categories.map((item) => {
              const active = selectedTags.includes(item.tag)
              return (
                <Button
                  key={item.tag}
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className={cn('rounded-full text-xs', active ? '' : 'text-muted-foreground')}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(item.tag)
                        ? prev.filter((tag) => tag !== item.tag)
                        : [...prev, item.tag],
                    )
                  }
                >
                  {item.tag}
                  <span className="ml-2 text-[10px] text-muted-foreground">{item.count}</span>
                </Button>
              )
            })
          )}
        </div>

        <MarketToolbar
          query={query}
          onQueryChange={setQuery}
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={(tag) =>
            setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
            )
          }
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={setSort}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button className="rounded-full">新建技能</Button>
          <Button variant="outline" className="rounded-full">
            导入 SKILL.md
          </Button>
          <Button variant="outline" className="rounded-full">
            导出选中
          </Button>
          <Button variant="outline" className="rounded-full" disabled>
            批量删除
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">技能列表</h3>
          <span className="text-xs text-muted-foreground">共 {filtered.length} 项</span>
        </div>
        {status === 'loading' ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            正在加载中...
          </div>
        ) : status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            加载失败，请稍后重试
          </div>
        ) : view === 'grid' ? (
          <MarketTable items={filtered} renderActions={renderLibraryActions} />
        ) : (
          <MarketList items={filtered} renderActions={renderLibraryActions} />
        )}
      </section>
    </section>
  )
}
