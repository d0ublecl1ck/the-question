import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import type { MarketSkill } from '@/pages/MarketPage'

type MarketTableProps = {
  items: MarketSkill[]
}

export default function MarketTable({ items }: MarketTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
        暂无技能
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/80">
      <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>名称</span>
        <span>标签</span>
        <span>评分</span>
        <span>收藏</span>
        <span className="text-right">操作</span>
      </div>
      <div className="divide-y divide-border/60" style={{ contentVisibility: 'auto' }}>
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_0.8fr] items-center gap-4 px-4 py-4 text-sm transition hover:bg-muted/10"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-2 text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
            <span>{item.rating.average.toFixed(1)}</span>
            <span>{item.favorites_count}</span>
            <div className="text-right">
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/skills/${item.id}`}>查看</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
