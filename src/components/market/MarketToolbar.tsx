import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type MarketToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  view: 'list' | 'table'
  onViewChange: (value: 'list' | 'table') => void
  sort: 'recent' | 'rating' | 'favorites'
  onSortChange: (value: 'recent' | 'rating' | 'favorites') => void
}

const sortOptions: Array<{ label: string; value: MarketToolbarProps['sort'] }> = [
  { label: '最新', value: 'recent' },
  { label: '评分', value: 'rating' },
  { label: '收藏', value: 'favorites' },
]

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
}: MarketToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="搜索技能"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 max-w-xl rounded-full bg-white"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">排序</span>
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
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => onViewChange('list')}
          >
            列表
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => onViewChange('table')}
          >
            表格
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">标签</span>
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">暂无标签</span>
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
