import { useEffect, useMemo, useState } from 'react'
import { fetchMarketSkills } from '@/services/market'

export type MarketSkill = {
  id: string
  name: string
  description: string
  tags: string[]
  favorites_count: number
  rating: { average: number; count: number }
  comments_count: number
  updated_at?: string
}

export default function MarketPage() {
  const [skills, setSkills] = useState<MarketSkill[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setStatus('loading')
      try {
        const data = await fetchMarketSkills()
        if (!alive) return
        setSkills(data)
        setStatus('ready')
      } catch (error) {
        if (!alive) return
        setStatus('error')
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const highlights = useMemo(() => skills.slice(0, 3), [skills])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    skills.forEach((skill) =>
      skill.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    )
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [skills])

  const paletteFor = (seed: string) => {
    const hue = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
    return {
      background: `linear-gradient(135deg, hsla(${hue}, 70%, 90%, 0.9), hsla(${hue + 25}, 80%, 85%, 0.7))`,
      accent: `hsl(${hue}, 65%, 45%)`,
    }
  }

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Market</p>
        <h2 className="text-3xl font-semibold">市场</h2>
        <p className="text-sm text-muted-foreground">
          官方技能与社区生态的入口。发现可复用流程并快速进入详情。
        </p>
      </header>

      <section className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">Highlights</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              精选推荐
            </span>
          </div>
          {status === 'error' ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              加载失败，请稍后重试
            </div>
          ) : highlights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
              暂无内容
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
              {highlights.map((item) => {
                const palette = paletteFor(item.id)
                return (
                  <article
                    key={item.id}
                    className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/80 p-6 shadow-sm"
                    style={{ background: palette.background }}
                  >
                    <div className="absolute inset-0 opacity-30" />
                    <div className="relative space-y-2">
                      <h4 className="text-lg font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <span
                        className="inline-flex items-center text-xs font-semibold"
                        style={{ color: palette.accent }}
                      >
                        {item.tags[0] ?? '精选'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">Categories</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              分类导航
            </span>
          </div>
          {status === 'error' ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              加载失败，请稍后重试
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
              暂无内容
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((item) => {
                const palette = paletteFor(item.tag)
                return (
                  <article
                    key={item.tag}
                    className="overflow-hidden rounded-3xl border border-border/60 bg-white/80 p-5 shadow-sm"
                  >
                    <div
                      className="mb-4 h-28 w-full rounded-2xl"
                      style={{ background: palette.background }}
                    />
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">{item.tag}</h4>
                      <p className="text-xs text-muted-foreground">{item.count} 项</p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </section>
  )
}
