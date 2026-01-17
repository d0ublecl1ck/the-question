import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLazySearchSkillsQuery } from '@/store/api/searchApi'
import { Link } from 'react-router-dom'

export type SearchSkill = {
  id: string
  name: string
  description: string
  tags: string[]
  visibility: string
  avatar?: string | null
  owner_id?: string | null
  created_at?: string
  updated_at?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [triggerSearch, { data: results = [], isFetching, isError, isUninitialized, reset }] =
    useLazySearchSkillsQuery()
  const status: 'idle' | 'loading' | 'ready' | 'error' = isUninitialized
    ? 'idle'
    : isFetching
      ? 'loading'
      : isError
        ? 'error'
        : 'ready'

  const tags = useMemo(() => {
    const set = new Set<string>()
    results.forEach((item) => item.tags.forEach((tag) => set.add(tag)))
    return Array.from(set)
  }, [results])

  const filteredResults = useMemo(() => {
    if (selectedTags.length === 0) return results
    return results.filter((item) => selectedTags.every((tag) => item.tags.includes(tag)))
  }, [results, selectedTags])

  const submit = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    triggerSearch(trimmed)
  }

  return (
    <section className="space-y-8 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Search</p>
        <h2 className="text-3xl font-semibold">搜索</h2>
        <p className="text-sm text-muted-foreground">
          关键词 + 语义混合检索。覆盖名称、描述、标签与指令内容。
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur lg:flex-row lg:items-center">
        <Input
          placeholder="搜索技能，例如：日报总结"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 rounded-full"
        />
        <Button onClick={submit} className="h-11 rounded-full px-6">
          搜索
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setQuery('')
            setSelectedTags([])
            reset()
          }}
          className="h-11 rounded-full px-6"
        >
          清空
        </Button>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">筛选标签</h3>
          <span className="text-xs text-muted-foreground">{filteredResults.length} 条结果</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-xs text-muted-foreground">暂无标签</span>
          ) : (
            tags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <Badge
                  key={tag}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                    )
                  }
                >
                  {tag}
                </Badge>
              )
            })
          )}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">搜索结果</h3>
          <span className="text-xs text-muted-foreground">{filteredResults.length} 条</span>
        </div>
        {status === 'idle' ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            输入关键词开始搜索
          </div>
        ) : status === 'loading' ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            搜索中...
          </div>
        ) : status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            搜索失败，请稍后重试
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
            没有匹配结果
          </div>
        ) : (
          <div className="space-y-4" style={{ contentVisibility: 'auto' }}>
            {filteredResults.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to={`/skills/${item.id}`}>查看详情</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
