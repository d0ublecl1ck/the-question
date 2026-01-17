import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const roleHighlights = [
  {
    title: '技能化工作流',
    description: '把重复流程沉淀成 Skill，随时复用并持续优化。',
  },
  {
    title: '对话式执行',
    description: '在一个对话里完成拆解、推进、复盘与交付。',
  },
  {
    title: '市场与生态',
    description: '浏览官方技能，快速对接成熟的解决方案。',
  },
  {
    title: '协作与治理',
    description: '团队共享、权限控制与数据可追溯。',
  },
]

const capabilityItems = [
  {
    title: '对话会话',
    metric: '24/7',
    detail: '随时开聊，明确上下文与行动链路。',
  },
  {
    title: '技能市场',
    metric: '1-Click',
    detail: '快速加载可复用技能，缩短启动成本。',
  },
  {
    title: '私有知识',
    metric: 'Secure',
    detail: '知识沉淀与权限管理并行，保证稳定可控。',
  },
]

const expertPicks = [
  {
    name: '交付专家 · 林澈',
    title: 'AI 方案架构师',
    description: '聚焦企业流程落地与技能化交付。',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: '行业顾问 · 苏然',
    title: '增长与运营',
    description: '擅长用对话驱动高价值转化。',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: '知识教练 · 叶晴',
    title: '知识体系设计',
    description: '把隐性经验转成可复用技能。',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: '协作顾问 · 程越',
    title: '组织协同',
    description: '打造跨团队的技能治理框架。',
    image:
      'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: '交互设计 · 许然',
    title: '体验策略',
    description: '让复杂流程像对话一样顺滑。',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
  },
]

export default function HomePage() {
  return (
    <section className="w-full space-y-20">
      <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">WenDui</p>
            <h2 className="text-sm font-medium text-muted-foreground">首页</h2>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            问对问题，遇见专家
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            问对是一个把对话与技能结合的 AI 平台，帮助团队把高价值流程沉淀为 Skill，在会话中
            直接调用并持续迭代。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full px-6">
              <Link to="/chat">开始体验</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/market">浏览技能市场</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>对话入口</span>
            <span>技能生态</span>
            <span>知识治理</span>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(235,240,255,0.7),rgba(235,245,240,0.8))] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.4)]">
          <div className="absolute left-[8%] top-[12%] h-24 w-24 rounded-full bg-[rgba(120,175,255,0.35)] blur-2xl" />
          <div className="absolute bottom-[18%] right-[12%] h-40 w-40 rounded-[60px] bg-[rgba(159,230,190,0.45)] blur-2xl" />
          <div className="absolute left-[12%] top-[52%] h-28 w-28 rounded-[36px] bg-white/60 blur-2xl" />
          <div className="absolute inset-0 flex items-end justify-start p-8">
            <div className="max-w-sm space-y-2 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Skill Hub</div>
              <div className="text-lg font-semibold text-slate-700">对话即执行</div>
              <div>对话、技能、知识统一在一个可控的工作台里。</div>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">为团队设计的对话式技能平台</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">核心能力</span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {roleHighlights.map((item) => (
            <div key={item.title} className="space-y-3">
              <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                {item.title}
              </div>
              <div className="text-lg font-semibold text-foreground">{item.title}</div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">专家精选</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Today's top picks
          </span>
        </div>
        <div className="relative overflow-hidden rounded-[32px] bg-neutral-100/80 px-4 py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(245,245,245,0.6))]" />
          <div className="relative flex flex-col items-center">
            <div className="mb-10 text-center text-lg font-medium text-neutral-700">
              今天推荐的专家阵容
            </div>
            <div className="flex w-full items-center justify-center gap-4 overflow-x-auto pb-6 pt-2">
              {expertPicks.map((expert, index) => (
                <div
                  key={`${expert.name}-${index}`}
                  className={[
                    'relative h-[260px] w-[220px] flex-shrink-0 overflow-hidden rounded-[22px] shadow-xl',
                    'bg-neutral-200',
                    index === 1 ? 'translate-y-4' : '',
                    index === 2 ? '-translate-y-6' : '',
                    index === 3 ? 'translate-y-6' : '',
                  ].join(' ')}
                >
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 space-y-1 text-white">
                    <div className="text-sm font-semibold">{expert.name}</div>
                    <div className="text-xs text-white/80">{expert.title}</div>
                    <div className="text-[11px] text-white/70">{expert.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">清晰、可控、可规模化</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">关键指标</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {capabilityItems.map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {item.title}
              </div>
              <div className="text-4xl font-semibold text-foreground">{item.metric}</div>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
