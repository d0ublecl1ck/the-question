import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('price', {
  zh: {
    header: {
      label: '收费方向',
      title: '未来可能的收费方式',
      description: '当前阶段全部功能免费开放，欢迎尽情体验。以下是我们计划中的收费方向，最终以正式上线为准。',
    },
    plans: [
      {
        badge: '方向 01',
        label: 'Community',
        title: '社区专家分享收费',
        description: '专家以技能/服务形式收费，平台提供分发与交易能力。',
        bullets: [
          '专家可设置付费技能、咨询或模板服务。',
          '平台按成交抽成（分成比例后续公示）。',
          '适用于垂直领域专家与高价值场景。',
        ],
      },
      {
        badge: '方向 02',
        label: 'Subscription',
        title: '订阅收费',
        description: '覆盖模型调用、平台功能与生成型能力。',
        bullets: ['AI 模型调用额度与稳定性保障。', '平台功能：技能管理、市场运营、协作与权限。', '卡片生图等创作工具与资产化能力。'],
      },
      {
        badge: '方向 03',
        label: 'Enterprise',
        title: '企业赋能服务',
        description: '提供解决方案与行业资讯服务。',
        bullets: ['结合行业实践输出可落地的解决方案。', '提供趋势洞察、最佳实践与资讯服务。', '支持定制化能力与交付协同。'],
      },
    ],
  },
  en: {
    header: {
      label: 'Pricing paths',
      title: 'Possible future pricing models',
      description: 'Everything is free right now. The plans below are our intended directions and are subject to change before launch.',
    },
    plans: [
      {
        badge: 'Track 01',
        label: 'Community',
        title: 'Paid expert sharing in the community',
        description: 'Experts charge for skills or services while the platform handles distribution and transactions.',
        bullets: [
          'Experts can set paid skills, consulting, or template services.',
          'The platform takes a commission (rate to be announced).',
          'Best for vertical experts and high-value scenarios.',
        ],
      },
      {
        badge: 'Track 02',
        label: 'Subscription',
        title: 'Subscription pricing',
        description: 'Covers model usage, platform features, and generative capabilities.',
        bullets: [
          'Model usage quotas and stability guarantees.',
          'Platform features: skill management, market ops, collaboration, permissions.',
          'Creative tools like card image generation and assetization.',
        ],
      },
      {
        badge: 'Track 03',
        label: 'Enterprise',
        title: 'Enterprise enablement services',
        description: 'Provide solutions and industry intelligence services.',
        bullets: [
          'Deliver actionable solutions grounded in industry practice.',
          'Provide trend insights, best practices, and intelligence.',
          'Support customization and coordinated delivery.',
        ],
      },
    ],
  },
})

export default function PricePage() {
  const { t } = useTranslation('price')
  const plans = t('plans', { returnObjects: true }) as Array<{
    badge: string
    label: string
    title: string
    description: string
    bullets: string[]
  }>
  return (
    <section className="w-full space-y-12">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t('header.label')}</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t('header.title')}
          </h1>
        </div>
        <p className="max-w-3xl text-base text-muted-foreground whitespace-nowrap">
          {t('header.description')}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.title} className="rounded-2xl border border-border/60 bg-white/80 shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{plan.badge}</Badge>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {plan.label}
                </span>
              </div>
              <CardTitle className="text-xl">{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
