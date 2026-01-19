import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'
import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react'
import type { MarketSkill } from '@/store/api/types'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('marketList', {
  zh: {
    empty: '暂无技能',
    aria: {
      viewSkill: '查看技能 {{name}}',
    },
    meta: {
      rating: '评分 {{rating}}',
      engagement: '收藏 {{favorites}} · 评论 {{comments}}',
    },
    actions: {
      viewDetails: '查看详情',
    },
  },
  en: {
    empty: 'No skills yet.',
    aria: {
      viewSkill: 'View skill {{name}}',
    },
    meta: {
      rating: 'Rating {{rating}}',
      engagement: 'Favorites {{favorites}} · Comments {{comments}}',
    },
    actions: {
      viewDetails: 'View details',
    },
  },
})

type MarketListProps = {
  items: MarketSkill[]
  renderActions?: (item: MarketSkill) => ReactNode
}

export default function MarketList({ items, renderActions }: MarketListProps) {
  const { t } = useTranslation('marketList')
  const navigate = useNavigate()
  if (items.length === 0) {
    return (
      <Alert className="rounded-2xl border-dashed border-border/60 bg-muted/10 shadow-none">
        <AlertDescription className="text-muted-foreground">{t('empty')}</AlertDescription>
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
            aria-label={t('aria.viewSkill', { name: item.name })}
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
                <span>{t('meta.rating', { rating: item.rating.average.toFixed(1) })}</span>
                <span className="text-muted-foreground">
                  {t('meta.engagement', {
                    favorites: item.favorites_count,
                    comments: item.comments_count,
                  })}
                </span>
                <div onClick={stopPropagation} onKeyDown={stopPropagation}>
                  {renderActions ? (
                    renderActions(item)
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full" onClick={handleOpen}>
                      {t('actions.viewDetails')}
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
