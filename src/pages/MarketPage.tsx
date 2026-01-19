import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useGetFavoriteSkillsQuery,
  useGetMarketSkillsQuery,
} from '@/store/api/marketApi'
import type { MarketSkill } from '@/store/api/types'
import MarketToolbar from '@/components/market/MarketToolbar'
import MarketList from '@/components/market/MarketList'
import MarketTable from '@/components/market/MarketTable'
import ExpertPlazaLayout from '@/components/market/ExpertPlazaLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { enqueueAlert } from '@/store/slices/alertSlice'

export default function MarketPage() {
  const dispatch = useAppDispatch()
  const authStatus = useAppSelector((state) => state.auth.status)
  const navigate = useNavigate()
  const { data: skills = [], isLoading, isError } = useGetMarketSkillsQuery()
  const isAuthed = authStatus === 'authenticated'
  const { data: favoriteSkills = [] } = useGetFavoriteSkillsQuery(undefined, { skip: !isAuthed })
  const [createFavorite] = useCreateFavoriteMutation()
  const [deleteFavorite] = useDeleteFavoriteMutation()
  const status: 'loading' | 'ready' | 'error' = isError ? 'error' : isLoading ? 'loading' : 'ready'
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [view, setView] = useState<'list' | 'grid'>('grid')
  const [sort, setSort] = useState<'recent' | 'rating' | 'favorites'>('recent')
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([])

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    skills.forEach((skill) =>
      skill.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    )
    return Array.from(counts.entries())
      .map(([tag]) => tag)
      .toSorted()
  }, [skills])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredItems = skills.filter((skill) => {
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
      recent: (items) =>
        items.toSorted((a, b) => {
          const aTime = a.updated_at ? Date.parse(a.updated_at) : 0
          const bTime = b.updated_at ? Date.parse(b.updated_at) : 0
          return bTime - aTime
        }),
      rating: (items) => items.toSorted((a, b) => b.rating.average - a.rating.average),
      favorites: (items) => items.toSorted((a, b) => b.favorites_count - a.favorites_count),
    }

    return sorters[sort](filteredItems)
  }, [query, selectedTags, skills, sort])

  const selectedSummary =
    selectedTags.length === 0 ? '全部标签' : `已选 ${selectedTags.length} 个标签`

  const favoriteIds = favoriteSkills.map((item) => item.skill_id)
  const favoriteSet = new Set(favoriteIds)
  const pendingFavoriteSet = new Set(pendingFavoriteIds)

  const handleToggleFavorite = async (skill: MarketSkill) => {
    if (!isAuthed) {
      dispatch(enqueueAlert({ description: '登录后才可以收藏' }))
      navigate('/login')
      return
    }
    if (pendingFavoriteSet.has(skill.id)) return
    setPendingFavoriteIds((prev) => (prev.includes(skill.id) ? prev : [...prev, skill.id]))
    try {
      if (favoriteSet.has(skill.id)) {
        await deleteFavorite({ skill_id: skill.id }).unwrap()
        dispatch(enqueueAlert({ description: '已取消收藏' }))
      } else {
        await createFavorite({ skill_id: skill.id }).unwrap()
        dispatch(enqueueAlert({ description: '已收藏' }))
      }
    } catch {
      dispatch(enqueueAlert({ description: '收藏操作失败', variant: 'destructive' }))
    } finally {
      setPendingFavoriteIds((prev) => prev.filter((id) => id !== skill.id))
    }
  }

  const handleUnauthorizedLibraryClick = () => {
    dispatch(enqueueAlert({ description: '本功能登录才可以使用' }))
    navigate('/login')
  }

  return (
    <ExpertPlazaLayout
      isAuthed={isAuthed}
      onUnauthorizedLibraryClick={handleUnauthorizedLibraryClick}
    >
      <section className="w-full space-y-8">
        <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">专家广场</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">社区</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                以标签、排序与视图切换快速筛选技能资产。
              </p>
            </div>
            <span className="rounded-full border border-border/60 bg-white/80 px-4 py-2 text-xs text-muted-foreground shadow-sm">
              {selectedSummary}
            </span>
          </div>
        </header>

        <section className="space-y-4">
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
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">专家列表</h3>
            <span className="text-xs text-muted-foreground">共 {filtered.length} 项</span>
          </div>
          {status === 'loading' ? (
            <Alert className="rounded-2xl border-dashed border-border/60 bg-muted/10 shadow-none">
              <AlertDescription className="text-muted-foreground">正在加载中...</AlertDescription>
            </Alert>
          ) : status === 'error' ? (
            <Alert variant="destructive" className="rounded-2xl border-dashed shadow-none">
              <AlertDescription>加载失败，请稍后重试</AlertDescription>
            </Alert>
          ) : view === 'grid' ? (
            <MarketTable
              items={filtered}
              favoriteIds={favoriteSet}
              pendingFavoriteIds={pendingFavoriteSet}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <MarketList items={filtered} />
          )}
        </section>
      </section>
    </ExpertPlazaLayout>
  )
}
