import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skillHubCard from '@/assets/skill-hub-card.png'
import expertDebater from '@/assets/experts/expert-debater.png'
import expertDesigner from '@/assets/experts/expert-designer.png'
import expertPainter from '@/assets/experts/expert-painter.png'
import expertArchitect from '@/assets/experts/expert-architect.png'
import expertWriter from '@/assets/experts/expert-writer.png'
import watchaLogo from '@/assets/Watcha.svg'
import { LogoCloud } from '@/components/ui/logo-cloud'
import { ModelScope } from '@lobehub/icons'

const acknowledgementLogos = [
  {
    alt: 'ModelScope',
    href: 'https://community.modelscope.cn/?utm_source=wendui',
    node: (
      <ModelScope.Combine
        size={60}
        type="color"
        style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
      />
    ),
  },
  {
    src: watchaLogo,
    alt: 'Watcha',
    href: 'https://watcha.cn/?utm_source=wendui',
    height: 56,
  },
  // {
  //   alt: 'MiniMax',
  //   href: 'https://www.minimax.io/?utm_source=wendui',
  //   node: (
  //     <Minimax.Combine size={60} type="color" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }} />
  //   ),
  // },
  // {
  //   alt: 'OpenAI',
  //   href: 'https://openai.com/?utm_source=wendui',
  //   node: (
  //     <OpenAI.Combine size={60} type="color" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }} />
  //   ),
  // },
]

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
    name: '辩论者 · 云澈',
    title: '论证与反驳',
    description: '快速拆解观点，构建有力论证链路。',
    image: expertDebater,
  },
  {
    name: '设计师 · 黎安',
    title: '视觉与体验',
    description: '把想法转成清晰、可落地的设计语言。',
    image: expertDesigner,
  },
  {
    name: '画家 · 牧青',
    title: '画面与风格',
    description: '捕捉情绪与氛围，输出有温度的视觉表达。',
    image: expertPainter,
  },
  {
    name: '架构师 · 星河',
    title: '系统与治理',
    description: '设计稳健架构，平衡扩展与成本。',
    image: expertArchitect,
  },
  {
    name: '作家 · 山海',
    title: '叙事与表达',
    description: '将复杂信息写成可读、可感的故事。',
    image: expertWriter,
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
                placeholder="写下你的痛点，立刻拿到行动计划"
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
        <div className="relative overflow-visible rounded-[32px] bg-neutral-100/80 px-4 py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(245,245,245,0.6))]" />
          <div className="relative flex flex-col items-center">
            <div className="mb-10 text-center text-lg font-medium text-neutral-700">
              今日精选
            </div>
            <div className="flex w-full items-center justify-center gap-4 overflow-visible overflow-x-auto pb-8 pt-8">
              {expertPicks.map((expert, index) => (
                <div
                  key={`${expert.name}-${index}`}
                  className={[
                    'group relative z-0 h-[260px] w-[220px] flex-shrink-0 overflow-hidden rounded-[22px] shadow-xl transition-transform duration-300 ease-out will-change-transform hover:z-10 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl',
                    'bg-neutral-200',
                    index === 1 ? 'translate-y-4' : '',
                    index === 2 ? '-translate-y-4' : '',
                    index === 3 ? 'translate-y-6' : '',
                  ].join(' ')}
                >
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
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
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">鸣谢</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Acknowledgements
          </span>
        </div>
        <LogoCloud
          data-testid="acknowledgements-logo-cloud"
          className="py-6"
          logos={acknowledgementLogos}
        />
      </section>
    </section>
  )
}
