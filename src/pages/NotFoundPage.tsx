import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-3xl border border-border bg-card/70 p-8 shadow-glow">
      <h2 className="text-2xl font-semibold">页面不存在</h2>
      <p className="text-sm text-muted-foreground">这条路径暂无内容，返回主页继续体验技能对话。</p>
      <Button onClick={() => navigate('/')}>回到对话</Button>
    </section>
  )
}
