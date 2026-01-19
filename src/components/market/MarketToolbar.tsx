import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('marketToolbar', {
  zh: {
    searchPlaceholder: '搜索技能',
    sortLabel: '排序',
    sortOptions: {
      recent: '最新',
      rating: '评分',
      favorites: '收藏',
    },
    view: {
      grid: '网格',
      list: '列表',
    },
    tagsLabel: '标签',
  },
  en: {
    searchPlaceholder: 'Search skills',
    sortLabel: 'Sort',
    sortOptions: {
      recent: 'Recent',
      rating: 'Rating',
      favorites: 'Favorites',
    },
    view: {
      grid: 'Grid',
      list: 'List',
    },
    tagsLabel: 'Tags',
  },
})

type MarketToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  view: 'list' | 'grid'
  onViewChange: (value: 'list' | 'grid') => void
  sort: 'recent' | 'rating' | 'favorites'
  onSortChange: (value: 'recent' | 'rating' | 'favorites') => void
  withContainer?: boolean
}

export default function MarketToolbar({
  query,
  onQueryChange,
  tags,
  selectedTags,
  onToggleTag,
  view,
  onViewChange,
  sort,
  onSortChange,
  withContainer = true,
}: MarketToolbarProps) {
  const { t } = useTranslation('marketToolbar')
  const { t: tCommon } = useTranslation('common')
  const sortOptions: Array<{ label: string; value: MarketToolbarProps['sort'] }> = [
    { label: t('sortOptions.recent'), value: 'recent' },
    { label: t('sortOptions.rating'), value: 'rating' },
    { label: t('sortOptions.favorites'), value: 'favorites' },
  ]
  const containerClassName = withContainer
    ? 'space-y-4 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur'
    : 'space-y-4'
  return (
    <div className={containerClassName}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 max-w-xl rounded-full bg-white"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t('sortLabel')}
            </span>
            <div className="flex items-center gap-1 rounded-full border border-border/60 p-1">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sort === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-full px-3 text-xs"
                  onClick={() => onSortChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => onViewChange('grid')}
          >
            {t('view.grid')}
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => onViewChange('list')}
          >
            {t('view.list')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t('tagsLabel')}
        </span>
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">{tCommon('status.emptyTags')}</span>
        ) : (
          tags.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <Badge
                key={tag}
                className={cn(
                  'cursor-pointer rounded-full border border-transparent px-3 py-1 text-xs transition',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted',
                )}
                onClick={() => onToggleTag(tag)}
              >
                {tag}
              </Badge>
            )
          })
        )}
      </div>
    </div>
  )
}
