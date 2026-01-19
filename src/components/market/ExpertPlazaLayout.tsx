import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('expertPlazaLayout', {
  zh: {
    title: '专家广场',
    nav: {
      community: '社区',
      library: '我的',
    },
    aria: {
      nav: '专家广场导航',
    },
  },
  en: {
    title: 'Expert Plaza',
    nav: {
      community: 'Community',
      library: 'My library',
    },
    aria: {
      nav: 'Expert plaza navigation',
    },
  },
})

type ExpertPlazaLayoutProps = {
  children: ReactNode
  sidebarExtra?: ReactNode
  isAuthed?: boolean
  onUnauthorizedLibraryClick?: () => void
}

export default function ExpertPlazaLayout({
  children,
  sidebarExtra,
  isAuthed = true,
  onUnauthorizedLibraryClick,
}: ExpertPlazaLayoutProps) {
  const { t } = useTranslation('expertPlazaLayout')
  const navItems = [
    { to: '/market', label: t('nav.community') },
    { to: '/library', label: t('nav.library') },
  ]

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-48">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('title')}</p>
          <nav className="mt-3 flex gap-2 lg:flex-col" aria-label={t('aria.nav')}>
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
