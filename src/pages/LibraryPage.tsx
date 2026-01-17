import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { MarketSkill } from './MarketPage'
import { fetchFavoriteSkills, fetchMarketSkillDetail } from '@/services/market'
import { Link } from 'react-router-dom'

type LibraryState = {
  status: 'loading' | 'ready' | 'error'
  items: MarketSkill[]
}

const libraryChips = ['收藏入口', '版本治理', 'AI 辅助']

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

  const summary = useMemo(() => {
    if (state.items.length === 0) {
      return { total: 0, average: 0, comments: 0 }
    }
    const totals = state.items.reduce(
      (acc, item) => ({
        rating: acc.rating + item.rating.average,
        comments: acc.comments + item.comments_count,
      }),
      { rating: 0, comments: 0 },
    )
    return {
      total: state.items.length,
      average: totals.rating / state.items.length,
      comments: totals.comments,
    }
  }, [state.items])

  return (
    <section className="w-full space-y-20">
      <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Library</p>
            <h2 className="text-sm font-medium text-muted-foreground">技能库</h2>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            收藏工作台
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            管理你的收藏与版本树，支持导入/导出与 AI 辅助编辑，让复用更简单。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="rounded-full px-6">
              导入 SKILL.md
            </Button>
            <Button variant="outline" className="rounded-full px-6">
              导出选中
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {libraryChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(235,240,255,0.7),rgba(235,245,240,0.8))] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.4)]">
          <div className="absolute left-[8%] top-[12%] h-24 w-24 rounded-full bg-[rgba(120,175,255,0.35)] blur-2xl" />
          <div className="absolute bottom-[18%] right-[12%] h-40 w-40 rounded-[60px] bg-[rgba(159,230,190,0.45)] blur-2xl" />
          <div className="absolute left-[12%] top-[52%] h-28 w-28 rounded-[36px] bg-white/60 blur-2xl" />
          <div className="absolute inset-0 flex items-end justify-start p-8">
            <div className="max-w-sm space-y-3 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Collection</div>
              <div className="text-lg font-semibold text-slate-700">收藏概览</div>
              <div>聚合收藏、评分与评论概况，快速定位重点技能。</div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">收藏</div>
                  <div className="text-xl font-semibold text-slate-700">{summary.total}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">评分</div>
                  <div className="text-xl font-semibold text-slate-700">
                    {summary.average.toFixed(1)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">评论</div>
                  <div className="text-xl font-semibold text-slate-700">{summary.comments}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-6 rounded-[32px] border border-border/60 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">收藏检索</h3>
            <p className="text-sm text-muted-foreground">按名称、描述或标签筛选你的收藏。</p>
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Filter</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-white/70 p-4">
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
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">收藏列表</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {filtered.length} 项
          </span>
        </div>
        {state.status === 'loading' ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : state.status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            加载失败，请稍后重试
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            暂无收藏技能
          </div>
        ) : (
          <div className="space-y-4" style={{ contentVisibility: 'auto' }}>
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {item.tags[0] ?? '收藏'}
                    </div>
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
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link to={`/skills/${item.id}`}>查看详情</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full" disabled>
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
