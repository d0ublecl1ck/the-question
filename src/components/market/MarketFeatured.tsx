import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import type { MarketSkill } from '@/store/api/types'

type MarketFeaturedProps = {
  items: MarketSkill[]
}

export default function MarketFeatured({ items }: MarketFeaturedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
        暂无精选技能
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold">{item.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to={`/skills/${item.id}`}>查看详情</Link>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-2">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            评分 {item.rating.average.toFixed(1)} · 收藏 {item.favorites_count}
          </div>
        </article>
      ))}
    </div>
  )
}
