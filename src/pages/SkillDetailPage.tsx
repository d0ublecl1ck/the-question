import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { MarketSkill } from '@/store/api/types'
import { useGetMarketSkillDetailQuery } from '@/store/api/marketApi'
import { useGetSkillDetailQuery } from '@/store/api/skillsApi'
import ReportDialog from '@/components/market/ReportDialog'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('skillDetail', {
  zh: {
    headerLabel: 'Skill Detail',
    status: {
      loading: '加载中...',
      notFound: '未找到技能详情',
    },
    rating: {
      label: '综合评分',
      engagement: '收藏 {{favorites}} · 评论 {{comments}}',
      favoriteAction: '收藏技能',
    },
    toc: '目录',
    skillMd: {
      label: 'SKILL.md',
      viewFull: '查看完整',
      previewTitle: 'SKILL.md 预览',
      loading: 'SKILL.md 加载中...',
      error: 'SKILL.md 加载失败。',
      empty: '发布者尚未提供 SKILL.md 内容。',
    },
    sections: {
      overview: {
        title: '技能概览',
        empty: '发布者尚未提供技能概览。',
      },
      scenarios: {
        title: '适用场景',
        withTags: '适合 {{tags}} 等场景。',
        empty: '暂未提供适用场景标签。',
      },
      capabilities: {
        title: '核心能力',
        empty: '发布者尚未补充技能能力与操作说明。',
      },
      examples: {
        title: '示例与指南',
        empty: '请在技能详情中补充示例与使用指南内容。',
      },
      updates: {
        title: '参考与更新',
        withDate: '最近更新：{{date}}',
        empty: '暂无更新时间信息。',
      },
    },
    comments: '评论区入口（即将接入）',
  },
  en: {
    headerLabel: 'Skill Detail',
    status: {
      loading: 'Loading...',
      notFound: 'Skill details not found.',
    },
    rating: {
      label: 'Overall rating',
      engagement: 'Favorites {{favorites}} · Comments {{comments}}',
      favoriteAction: 'Favorite skill',
    },
    toc: 'Contents',
    skillMd: {
      label: 'SKILL.md',
      viewFull: 'View full',
      previewTitle: 'SKILL.md preview',
      loading: 'Loading SKILL.md...',
      error: 'Failed to load SKILL.md.',
      empty: 'No SKILL.md content provided.',
    },
    sections: {
      overview: {
        title: 'Overview',
        empty: 'The author has not provided an overview.',
      },
      scenarios: {
        title: 'Use cases',
        withTags: 'Suitable for {{tags}} and more.',
        empty: 'No scenario tags provided.',
      },
      capabilities: {
        title: 'Core capabilities',
        empty: 'No capability or usage notes provided.',
      },
      examples: {
        title: 'Examples & guides',
        empty: 'Please add examples and usage guides in the skill details.',
      },
      updates: {
        title: 'References & updates',
        withDate: 'Last updated: {{date}}',
        empty: 'No update timestamp.',
      },
    },
    comments: 'Comments coming soon.',
  },
})

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/
const SKILL_PREVIEW_MAX_LINES = 10

export default function SkillDetailPage() {
  const { t } = useTranslation('skillDetail')
  const { id } = useParams()
  const { data, isLoading, isError } = useGetMarketSkillDetailQuery(id ?? '', { skip: !id })
  const {
    data: skillDetail,
    isLoading: isSkillLoading,
    isError: isSkillError,
  } = useGetSkillDetailQuery(id ?? '', { skip: !id })
  const status: 'loading' | 'ready' | 'error' = !id || isError ? 'error' : isLoading ? 'loading' : 'ready'

  if (status === 'loading') {
    return (
      <section className="py-6">
        <p className="text-sm text-muted-foreground">{t('status.loading')}</p>
      </section>
    )
  }

  if (status === 'error' || !data) {
    return (
      <section className="py-6">
        <p className="text-sm text-muted-foreground">{t('status.notFound')}</p>
      </section>
    )
  }

  const detail: MarketSkill = data
  const sectionList = [
    {
      title: t('sections.overview.title'),
      body: detail.description || t('sections.overview.empty'),
    },
    {
      title: t('sections.scenarios.title'),
      body:
        detail.tags.length > 0
          ? t('sections.scenarios.withTags', { tags: detail.tags.join(' / ') })
          : t('sections.scenarios.empty'),
    },
    {
      title: t('sections.capabilities.title'),
      body: t('sections.capabilities.empty'),
    },
    {
      title: t('sections.examples.title'),
      body: t('sections.examples.empty'),
    },
    {
      title: t('sections.updates.title'),
      body: detail.updated_at
        ? t('sections.updates.withDate', { date: detail.updated_at })
        : t('sections.updates.empty'),
    },
  ]
  const rawSkillContent = (skillDetail?.content ?? '').trim()
  const strippedSkillContent = rawSkillContent ? rawSkillContent.replace(FRONTMATTER_REGEX, '').trim() : ''
  const skillContentSource = strippedSkillContent || rawSkillContent
  const skillPreviewLines = skillContentSource ? skillContentSource.split('\n') : []
  const skillPreviewText = skillPreviewLines.slice(0, SKILL_PREVIEW_MAX_LINES).join('\n')
  const isPreviewTrimmed = skillPreviewLines.length > SKILL_PREVIEW_MAX_LINES
  const hasSkillContent = Boolean(skillContentSource)
  const skillPreviewBody = isSkillLoading
    ? t('skillMd.loading')
    : isSkillError
      ? t('skillMd.error')
      : hasSkillContent
        ? `${skillPreviewText}${isPreviewTrimmed ? '\n...' : ''}`
        : t('skillMd.empty')

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t('headerLabel')}</p>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground">{detail.name}</h2>
          <p className="max-w-2xl text-base text-muted-foreground">{detail.description}</p>
          <div className="flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <aside className="w-full space-y-3 lg:w-72">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{t('rating.label')}</span>
            <span className="text-lg">{detail.rating.average.toFixed(1)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('rating.engagement', {
              favorites: detail.favorites_count,
              comments: detail.comments_count,
            })}
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            {t('rating.favoriteAction')}
          </Button>
          <ReportDialog targetId={detail.id} targetName={detail.name} />
        </aside>
      </header>

      <Separator className="my-8" />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{t('toc')}</p>
          <nav className="space-y-3 text-sm font-medium text-foreground/80">
            {sectionList.map((section) => (
              <a key={section.title} href={`#${section.title}`} className="block transition hover:text-foreground">
                {section.title}
              </a>
            ))}
          </nav>
          <Dialog>
            <div className="rounded-2xl border border-border/70 bg-muted/10 p-4 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{t('skillMd.label')}</p>
                {hasSkillContent && (
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                      {t('skillMd.viewFull')}
                    </Button>
                  </DialogTrigger>
                )}
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/70">
                {skillPreviewBody}
              </pre>
            </div>
            {hasSkillContent && (
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-base">{t('skillMd.previewTitle')}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-3">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                    {rawSkillContent || skillContentSource}
                  </pre>
                </ScrollArea>
              </DialogContent>
            )}
          </Dialog>
        </aside>

        <div className="space-y-6">
          {sectionList.map((section) => (
            <article
              key={section.title}
              id={section.title}
              className="border-b border-border/60 pb-6 last:border-b-0 last:pb-0"
            >
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{section.title}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80">{section.body}</p>
            </article>
          ))}
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
            {t('comments')}
          </div>
        </div>
      </div>
    </section>
  )
}
