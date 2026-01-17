import { Pricing } from '@/components/ui/pricing-cards'

export default function PricePage() {
  return (
    <section className="w-full space-y-12">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Pricing</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            为不同规模团队准备的方案
          </h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          从试点到全量上线，问对提供可扩展的对话式技能平台。你可以先从一个技能切入，再逐步
          扩展到市场、搜索与知识治理。
        </p>
      </header>
      <Pricing />
    </section>
  )
}
