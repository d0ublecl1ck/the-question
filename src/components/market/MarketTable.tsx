import { Badge } from '@/components/ui/badge'
import { Rating } from '@/components/ui/rating'
import { HeartButton } from '@/components/ui/heart-button'
import { useNavigate } from 'react-router-dom'
import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react'
import type { MarketSkill } from '@/store/api/types'

type MarketTableProps = {
  items: MarketSkill[]
  renderActions?: (item: MarketSkill) => ReactNode
}

export default function MarketTable({ items, renderActions }: MarketTableProps) {
  const navigate = useNavigate()
  const fallbackCover =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'

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
            className="group flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className="relative aspect-[10/7] w-full bg-[linear-gradient(135deg,rgba(226,232,240,0.9),rgba(248,250,252,0.9))]"
              aria-hidden={item.avatar ? undefined : true}
            >
              <img
                src={item.avatar ?? fallbackCover}
                alt={`${item.name} cover`}
                className="h-full w-full max-h-56 max-w-full object-cover"
                loading="lazy"
              />
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
              <div className="mt-5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Rating rating={item.rating.average} showValue size="sm" />
                </div>
                <div onClick={stopPropagation} onKeyDown={stopPropagation}>
                  <HeartButton initialCount={item.favorites_count} label="收藏" />
                </div>
                {renderActions ? (
                  <div onClick={stopPropagation} onKeyDown={stopPropagation}>
                    {renderActions(item)}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
