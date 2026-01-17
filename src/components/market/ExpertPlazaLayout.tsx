import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

type ExpertPlazaLayoutProps = {
  children: ReactNode
  sidebarExtra?: ReactNode
  isAuthed?: boolean
  onUnauthorizedLibraryClick?: () => void
}

const navItems = [
  { to: '/market', label: '社区' },
  { to: '/library', label: '我的' },
]

export default function ExpertPlazaLayout({
  children,
  sidebarExtra,
  isAuthed = true,
  onUnauthorizedLibraryClick,
}: ExpertPlazaLayoutProps) {

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-48">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">专家广场</p>
          <nav className="mt-3 flex gap-2 lg:flex-col" aria-label="专家广场导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center rounded-full px-4 py-2 text-sm transition',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )
                }
                onClick={(event) => {
                  if (item.to !== '/library' || isAuthed) return
                  event.preventDefault()
                  onUnauthorizedLibraryClick?.()
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {sidebarExtra ? <div className="mt-4 border-t border-border/60 pt-4">{sidebarExtra}</div> : null}
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
