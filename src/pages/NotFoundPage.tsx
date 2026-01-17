import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 rounded-3xl border border-border/70 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 p-10 shadow-glow backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h2 className="text-3xl font-semibold">页面不存在</h2>
        <p className="text-sm text-muted-foreground">这条路径暂无内容，返回主页继续体验技能对话。</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => navigate('/')} className="rounded-full">
          回到对话
        </Button>
        <Button variant="outline" onClick={() => navigate('/market')} className="rounded-full">
          去市场看看
        </Button>
      </div>
    </section>
  )
}
