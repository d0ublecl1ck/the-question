import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-glow">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">登录后同步记忆与个人技能库。</p>
        <div className="mt-6 space-y-4">
          <Input placeholder="邮箱" type="email" />
          <Input placeholder="密码" type="password" />
          <Button className="w-full">进入工作台</Button>
        </div>
      </div>
    </section>
  )
}
