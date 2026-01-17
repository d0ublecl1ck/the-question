import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { MarketSkill } from '@/store/api/types'
import { useGetMarketSkillDetailQuery } from '@/store/api/marketApi'
import ReportDialog from '@/components/market/ReportDialog'

export default function SkillDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useGetMarketSkillDetailQuery(id ?? '', { skip: !id })
  const status: 'loading' | 'ready' | 'error' = !id || isError ? 'error' : isLoading ? 'loading' : 'ready'

  if (status === 'loading') {
    return (
      <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </section>
    )
  }

  if (status === 'error' || !data) {
    return (
      <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg">
        <p className="text-sm text-muted-foreground">未找到技能详情</p>
      </section>
    )
  }

  const detail: MarketSkill = data

  return (
    <section className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg backdrop-blur">
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
        <aside className="flex w-full flex-col gap-2 rounded-2xl border border-border/60 bg-white/70 p-4 lg:w-64">
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
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
          SKILL.md 预览入口（即将接入）
        </div>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
          评论区入口（即将接入）
        </div>
      </div>
    </section>
  )
}
