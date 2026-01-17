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
      <section className="py-6">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </section>
    )
  }

  if (status === 'error' || !data) {
    return (
      <section className="py-6">
        <p className="text-sm text-muted-foreground">未找到技能详情</p>
      </section>
    )
  }

  const detail: MarketSkill = data
  const sectionList = [
    {
      title: '技能概览',
      body: detail.description || '发布者尚未提供技能概览。',
    },
    {
      title: '适用场景',
      body:
        detail.tags.length > 0
          ? `适合 ${detail.tags.join(' / ')} 等场景。`
          : '暂未提供适用场景标签。',
    },
    {
      title: '核心能力',
      body: '发布者尚未补充技能能力与操作说明。',
    },
    {
      title: '示例与指南',
      body: '请在技能详情中补充示例与使用指南内容。',
    },
    {
      title: '参考与更新',
      body: detail.updated_at ? `最近更新：${detail.updated_at}` : '暂无更新时间信息。',
    },
  ]

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Skill Detail</p>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground">{detail.name}</h2>
          <p className="max-w-2xl text-base text-muted-foreground">{detail.description}</p>
          <div className="flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <aside className="w-full space-y-3 lg:w-72">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>综合评分</span>
            <span className="text-lg">{detail.rating.average.toFixed(1)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            收藏 {detail.favorites_count} · 评论 {detail.comments_count}
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            收藏技能
          </Button>
          <ReportDialog targetId={detail.id} targetName={detail.name} />
        </aside>
      </header>

      <Separator className="my-8" />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">目录</p>
          <nav className="space-y-3 text-sm font-medium text-foreground/80">
            {sectionList.map((section) => (
              <a key={section.title} href={`#${section.title}`} className="block transition hover:text-foreground">
                {section.title}
              </a>
            ))}
          </nav>
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-xs text-muted-foreground">
            SKILL.md 预览入口（即将接入）
          </div>
        </aside>

        <div className="space-y-6">
          {sectionList.map((section) => (
            <article
              key={section.title}
              id={section.title}
              className="border-b border-border/60 pb-6 last:border-b-0 last:pb-0"
            >
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{section.title}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80">{section.body}</p>
            </article>
          ))}
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
            评论区入口（即将接入）
          </div>
        </div>
      </div>
    </section>
  )
}
