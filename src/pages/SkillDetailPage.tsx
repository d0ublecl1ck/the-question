import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { MarketSkill } from './MarketPage'
import { fetchMarketSkillDetail } from '@/services/market'
import ReportDialog from '@/components/market/ReportDialog'

type DetailState = {
  status: 'loading' | 'ready' | 'error'
  data?: MarketSkill
}

export default function SkillDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<DetailState>({ status: 'loading' })

  useEffect(() => {
    if (!id) {
      setState({ status: 'error' })
      return
    }
    let alive = true
    const load = async () => {
      try {
        const data = await fetchMarketSkillDetail(id)
        if (!alive) return
        setState({ status: 'ready', data })
      } catch (error) {
        if (!alive) return
        setState({ status: 'error' })
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  if (state.status === 'loading') {
    return (
      <section className="rounded-3xl border border-border bg-card/70 p-6 shadow-glow">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </section>
    )
  }

  if (state.status === 'error' || !state.data) {
    return (
      <section className="rounded-3xl border border-border bg-card/70 p-6 shadow-glow">
        <p className="text-sm text-muted-foreground">未找到技能详情</p>
      </section>
    )
  }

  const detail = state.data

  return (
    <section className="space-y-6 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-glow">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Skill</p>
          <h2 className="text-3xl font-semibold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">{detail.description}</p>
          <div className="flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-2">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <aside className="flex w-full flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-4 lg:w-64">
          <div className="text-sm">评分 {detail.rating.average.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">
            收藏 {detail.favorites_count} · 评论 {detail.comments_count}
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            收藏
          </Button>
          <ReportDialog targetId={detail.id} targetName={detail.name} />
        </aside>
      </header>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          SKILL.md 预览入口（即将接入）
        </div>
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          评论区入口（即将接入）
        </div>
      </div>
    </section>
  )
}
