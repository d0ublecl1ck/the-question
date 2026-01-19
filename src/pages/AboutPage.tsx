import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('about', {
  zh: {
    header: {
      label: 'About',
      title: '让科技不再高高在上，真正服务每一个人',
      description:
        '问对面向普罗大众，让人人都能感受到新技术的便利。我们会自动识别你日常重复的工作流，把它们积累成可复用、可分享的 Skill 专家，方便以后直接使用，并支持分享与交流社区的共同成长。',
    },
    highlights: [
      {
        title: '科技服务人民',
        description: '让新技术不再高高在上，而是触手可及、立刻可用。',
      },
      {
        title: '人人都是专家',
        description: 'Skill 不只是技术党的专利，每个人都能沉淀自己的经验。',
      },
      {
        title: '社区式成长',
        description: '分享、交流、共创，让好用的技能被更多人使用。',
      },
    ],
    pillarsSection: {
      title: '我们正在提供的核心服务',
      label: 'Platform',
    },
    pillars: [
      {
        title: '自动识别流程',
        detail: '自动发现重复的工作流，把高频动作沉淀成技能。',
      },
      {
        title: '可复用可分享',
        detail: '技能可以被保存、复用、共享，减少重复劳动与信息断层。',
      },
      {
        title: '交流型社区',
        detail: '围绕技能建立社区，让经验被复盘、迭代与放大。',
      },
    ],
    contact: {
      label: 'Contact',
      title: '让更多人感受到新技术的便利。',
    },
  },
  en: {
    header: {
      label: 'About',
      title: 'Bring technology down to earth and serve everyone',
      description:
        'WenDui is built for everyone. We automatically detect your repetitive workflows and turn them into reusable, shareable Skill experts, so you can reuse them later and grow with a collaborative community.',
    },
    highlights: [
      {
        title: 'Technology for people',
        description: 'Make new tech accessible, approachable, and immediately useful.',
      },
      {
        title: 'Everyone is an expert',
        description: 'Skills are not just for developers—anyone can distill their experience.',
      },
      {
        title: 'Community growth',
        description: 'Share, exchange, and co-create so great skills reach more people.',
      },
    ],
    pillarsSection: {
      title: 'Core services we deliver',
      label: 'Platform',
    },
    pillars: [
      {
        title: 'Automatic workflow detection',
        detail: 'Detect repeated workflows and turn high-frequency actions into skills.',
      },
      {
        title: 'Reusable and shareable',
        detail: 'Save, reuse, and share skills to reduce rework and knowledge gaps.',
      },
      {
        title: 'Community of practice',
        detail: 'Build communities around skills to review, iterate, and amplify experience.',
      },
    ],
    contact: {
      label: 'Contact',
      title: 'Help more people experience the convenience of new tech.',
    },
  },
})

export default function AboutPage() {
  const { t } = useTranslation('about')
  const highlights = t('highlights', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>
  const pillars = t('pillars', { returnObjects: true }) as Array<{ title: string; detail: string }>
  return (
    <section className="w-full space-y-16">
      <header className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t('header.label')}</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t('header.title')}
          </h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t('header.description')}
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {item.title}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">{t('pillarsSection.title')}</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {t('pillarsSection.label')}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item) => (
            <div key={item.title} className="space-y-3">
              <div className="text-lg font-semibold text-foreground">{item.title}</div>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-muted/40 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t('contact.label')}</div>
            <p className="mt-2 text-lg font-semibold text-foreground">{t('contact.title')}</p>
          </div>
          <div className="text-sm text-muted-foreground">d0ublecl1ckhpx@gmail.com</div>
        </div>
      </section>
    </section>
  )
}
