import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skillHubCard from '@/assets/skill-hub-card.png'

const roleHighlights = [
  {
    label: 'Skill Flow',
    title: '技能化工作流',
    description: '把重复流程沉淀成 Skill，随时复用并持续优化。',
  },
  {
    label: 'Dialogue Ops',
    title: '对话式执行',
    description: '在一个对话里完成拆解、推进、复盘与交付。',
  },
  {
    label: 'Market & Ecosystem',
    title: '市场与生态',
    description: '浏览官方技能，快速对接成熟的解决方案。',
  },
  {
    label: 'Collaboration',
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
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const handleSubmit = () => {
    const nextDraft = prompt.trim()
    if (!nextDraft) {
      navigate('/chat')
      return
    }
    navigate('/chat', { state: { draft: nextDraft } })
  }

  return (
    <section className="w-full space-y-14">
      <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">WenDui</p>
            <h2 className="text-sm font-medium text-muted-foreground">问对</h2>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            问对问题，遇见专家
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            我们帮您从提问中生成技能专家，让每个问题都有专家级的解决方案。
          </p>
          <div className="rounded-[28px] bg-slate-100/70 p-2 shadow-sm">
            <form
              className="ai-pulse flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault()
                handleSubmit()
              }}
            >
              <textarea
                name="prompt"
                aria-label="AI 对话输入"
                placeholder="输入你的问题，回车开始对话"
                rows={2}
                className="min-h-[72px] w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={prompt}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSubmit()
                  }
                }}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 text-slate-600 hover:bg-black/10"
                  aria-label="发送"
                >
                  &gt;
                </button>
              </div>
            </form>
          </div>
        </div>
        <Link
          to="/market"
          aria-label="进入技能市场"
          className="group block"
          data-testid="skill-hub-hero"
        >
          <div className="relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-[0_40px_90px_-40px_rgba(15,23,42,0.4)] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_50px_110px_-50px_rgba(15,23,42,0.5)]">
            <div
              className="flex-1 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${skillHubCard})` }}
            />
            <div className="bg-white/95 px-8 py-6">
              <div className="max-w-sm space-y-2 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Expert Market
                </div>
                <div className="text-lg font-semibold text-slate-700">开始探索</div>
                <div>创建、搜集、分享你的专家团队。</div>
              </div>
            </div>
          </div>
        </Link>
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
                {item.label}
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
