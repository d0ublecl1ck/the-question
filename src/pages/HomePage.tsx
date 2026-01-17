import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="w-full space-y-8 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-lg backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Home</p>
        <h2 className="text-3xl font-semibold">首页</h2>
        <p className="text-sm text-muted-foreground">
          聚合你的 AI 工作台入口，快速进入对话、市场与技能库。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm">
          <h3 className="text-lg font-semibold">开始对话</h3>
          <p className="mt-2 text-sm text-muted-foreground">进入实时对话，继续你的任务。</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/chat">进入对话</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm">
          <h3 className="text-lg font-semibold">浏览市场</h3>
          <p className="mt-2 text-sm text-muted-foreground">发现新的技能与模板。</p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/market">去市场看看</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
