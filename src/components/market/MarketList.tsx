import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'
import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react'
import type { MarketSkill } from '@/store/api/types'

type MarketListProps = {
  items: MarketSkill[]
  renderActions?: (item: MarketSkill) => ReactNode
}

export default function MarketList({ items, renderActions }: MarketListProps) {
  const navigate = useNavigate()
  if (items.length === 0) {
    return (
      <Alert className="rounded-2xl border-dashed border-border/60 bg-muted/10 shadow-none">
        <AlertDescription className="text-muted-foreground">暂无技能</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4" style={{ contentVisibility: 'auto' }}>
      {items.map((item, index) => {
        const handleOpen = () => navigate(`/skills/${item.id}`)
        const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          handleOpen()
        }
        const stopPropagation = (event: SyntheticEvent) => event.stopPropagation()
        return (
          <article
            key={item.id}
            role="link"
            tabIndex={0}
            aria-label={`查看技能 ${item.name}`}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            className="cursor-pointer rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                <div onClick={stopPropagation} onKeyDown={stopPropagation}>
                  {renderActions ? (
                    renderActions(item)
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full" onClick={handleOpen}>
                      查看详情
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {index < items.length - 1 && <Separator className="mt-5" />}
          </article>
        )
      })}
    </div>
  )
}
