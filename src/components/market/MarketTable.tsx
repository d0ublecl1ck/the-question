import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MarketSkill } from '@/store/api/types'

type MarketTableProps = {
  items: MarketSkill[]
  renderActions?: (item: MarketSkill) => ReactNode
}

export default function MarketTable({ items, renderActions }: MarketTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
        暂无技能
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" style={{ contentVisibility: 'auto' }}>
      {items.map((item) => (
        <article
          key={item.id}
          className="group flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-2 text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <span>评分 {item.rating.average.toFixed(1)}</span>
            <span>收藏 {item.favorites_count}</span>
            {renderActions ? (
              renderActions(item)
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/skills/${item.id}`}>查看</Link>
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
