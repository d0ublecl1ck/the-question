import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { MarketSkill } from './MarketPage'
import { fetchFavoriteSkills, fetchMarketSkillDetail } from '@/services/market'

type LibraryState = {
  status: 'loading' | 'ready' | 'error'
  items: MarketSkill[]
}

export default function LibraryPage() {
  const [state, setState] = useState<LibraryState>({ status: 'loading', items: [] })
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const favorites = await fetchFavoriteSkills()
        const details = await Promise.all(
          favorites.map((item) => fetchMarketSkillDetail(item.skill_id)),
        )
        if (!alive) return
        setState({ status: 'ready', items: details })
      } catch (error) {
        if (!alive) return
        setState({ status: 'error', items: [] })
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return state.items
    return state.items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalized)),
    )
  }, [query, state.items])

  return (
    <section className="space-y-8 rounded-3xl border border-border/70 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 p-6 shadow-glow backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Library</p>
        <h2 className="text-3xl font-semibold">技能库</h2>
        <p className="text-sm text-muted-foreground">
          管理你的收藏与版本树，支持导入/导出与 AI 辅助编辑。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索你的收藏"
          className="h-10 w-full rounded-full sm:w-72"
        />
        <Button variant="outline" className="rounded-full">
          导入 SKILL.md
        </Button>
        <Button variant="outline" className="rounded-full">
          导出选中
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">收藏列表</h3>
          <span className="text-xs text-muted-foreground">{filtered.length} 项</span>
        </div>
        {state.status === 'loading' ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : state.status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            加载失败，请稍后重试
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            暂无收藏技能
          </div>
        ) : (
          <div className="space-y-4" style={{ contentVisibility: 'auto' }}>
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full px-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      查看详情
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                      版本树
                    </Button>
                  </div>
                </div>
                <Separator className="mt-4" />
                <div className="mt-3 text-xs text-muted-foreground">
                  评分 {item.rating.average.toFixed(1)} · 评论 {item.comments_count}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
