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
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      style={{ contentVisibility: 'auto' }}
    >
      {items.map((item) => {
        const card = (
          <>
            <div
              className="relative aspect-[10/7] w-full bg-[linear-gradient(135deg,rgba(226,232,240,0.9),rgba(248,250,252,0.9))]"
              aria-hidden={item.avatar ? undefined : true}
            >
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={`${item.name} cover`}
                  className="h-full w-full max-h-56 max-w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Cover
                </div>
              )}
            </div>
            <div className="flex h-full flex-col justify-between p-5">
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
                {renderActions ? renderActions(item) : <span className="text-muted-foreground">打开</span>}
              </div>
            </div>
          </>
        )

        return renderActions ? (
          <article
            key={item.id}
            className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {card}
          </article>
        ) : (
          <Link
            key={item.id}
            to={`/skills/${item.id}`}
            className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {card}
          </Link>
        )
      })}
    </div>
  )
}
