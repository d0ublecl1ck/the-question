import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MarketSkill } from '@/store/api/types'

type MarketListProps = {
  items: MarketSkill[]
  renderActions?: (item: MarketSkill) => ReactNode
}

export default function MarketList({ items, renderActions }: MarketListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
        暂无技能
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ contentVisibility: 'auto' }}>
      {items.map((item, index) => (
        <article
          key={item.id}
          className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="flex flex-col items-start gap-2 text-sm lg:items-end">
              <span>评分 {item.rating.average.toFixed(1)}</span>
              <span className="text-muted-foreground">
                收藏 {item.favorites_count} · 评论 {item.comments_count}
              </span>
              {renderActions ? (
                renderActions(item)
              ) : (
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to={`/skills/${item.id}`}>查看详情</Link>
                </Button>
              )}
            </div>
          </div>
          {index < items.length - 1 && <Separator className="mt-5" />}
        </article>
      ))}
    </div>
  )
}
