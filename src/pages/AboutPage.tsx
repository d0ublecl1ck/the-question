const highlights = [
  {
    title: '研究与实践结合',
    description: '深耕对话式 AI 与流程自动化，把复杂任务变成可复用技能。',
  },
  {
    title: '跨域团队协作',
    description: '产品、工程与设计协同推进，确保交付和体验一致。',
  },
  {
    title: '企业级落地',
    description: '面向真实业务场景，强调稳定性、可控性与持续迭代。',
  },
]

const pillars = [
  {
    title: '对话式技能',
    detail: '把业务流程拆解为可复用的 Skill，减少重复劳动。',
  },
  {
    title: '技能市场',
    detail: '官方技能市场提供高质量模板，帮助团队快速启动。',
  },
  {
    title: '知识治理',
    detail: '数据可追溯、权限可控，确保团队协作稳定可持续。',
  },
]

export default function AboutPage() {
  return (
    <section className="w-full space-y-16">
      <header className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">About</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            我们在构建面向团队的对话式技能平台
          </h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          问对专注于把对话与技能系统融合在一起，让团队能够在真实业务场景中把流程沉淀为可复用
          的 Skill。我们相信对话只是入口，真正的价值来自于可复制、可验证、可演进的执行能力。
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
          <h2 className="text-2xl font-semibold">我们正在提供的核心服务</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Platform</span>
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
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Contact</div>
            <p className="mt-2 text-lg font-semibold text-foreground">让我们一起定义你的 Skill 体系。</p>
          </div>
          <div className="text-sm text-muted-foreground">support@wendui.ai · partnerships@wendui.ai</div>
        </div>
      </section>
    </section>
  )
}
