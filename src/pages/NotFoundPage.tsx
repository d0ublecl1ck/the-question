import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('notFound', {
  zh: {
    title: '页面不存在',
    description: '这条路径暂无内容，返回主页继续体验技能对话。',
    actions: {
      backChat: '回到对话',
      goMarket: '去市场看看',
    },
  },
  en: {
    title: 'Page not found',
    description: 'Nothing here yet. Go back to chat or explore the market.',
    actions: {
      backChat: 'Back to chat',
      goMarket: 'Explore the market',
    },
  },
})

export default function NotFoundPage() {
  const { t } = useTranslation('notFound')
  const navigate = useNavigate()
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 rounded-3xl border border-border/70 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 p-10 shadow-glow backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h2 className="text-3xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => navigate('/')} className="rounded-full">
          {t('actions.backChat')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/market')} className="rounded-full">
          {t('actions.goMarket')}
        </Button>
      </div>
    </section>
  )
}
