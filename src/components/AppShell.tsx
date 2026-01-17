import { NavLink, Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BookOpen, MessageSquare, Search, Settings, Store, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', label: '对话', icon: MessageSquare },
  { to: '/market', label: '市场', icon: Store },
  { to: '/library', label: '技能库', icon: BookOpen },
  { to: '/search', label: '搜索', icon: Search },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-border/60 bg-white/70 px-6 py-8 backdrop-blur lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">问对 · WenDui</p>
              <p className="text-xs text-muted-foreground">对话驱动的技能中枢</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary">MVP</Badge>
            <Badge variant="outline">AI 协作</Badge>
          </div>
          <Separator className="my-6" />
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-foreground text-background shadow'
                        : 'text-foreground/80 hover:bg-muted/60',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">今日状态</p>
            <p className="mt-1 text-sm font-semibold">技能匹配 92%</p>
            <Button className="mt-4 w-full rounded-full" size="sm">
              新建会话
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-white/80 px-6 py-4 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
              <h1 className="text-xl font-semibold tracking-tight">技能驱动对话</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">已连接本地后端</Badge>
              <Button variant="ghost" size="sm">
                通知
              </Button>
            </div>
          </header>
          <main className="flex-1 px-6 pb-24 pt-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[92%] -translate-x-1/2 items-center justify-between rounded-2xl border border-border/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )}
        })}
      </nav>
    </div>
  )
}
