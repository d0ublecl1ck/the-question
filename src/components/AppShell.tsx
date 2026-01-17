import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/price', label: 'Price' },
]

const authedNavItems = [
  { to: '/', label: 'Home' },
  { to: '/chat', label: 'Chat' },
  { to: '/market', label: 'Market' },
  { to: '/library', label: 'Library' },
  { to: '/search', label: 'Search' },
  { to: '/settings', label: 'Settings' },
]

export default function AppShell() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)
  const isAuthed = status === 'authenticated'
  const navItems = isAuthed ? authedNavItems : publicNavItems
  const email = user?.email ?? ''
  const avatarSeed = email || 'anonymous'
  const accent = Array.from(avatarSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
  const initials = email ? email.slice(0, 1).toUpperCase() : '?'

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between gap-6 px-6">
          <Link to="/" className="flex h-14 items-center text-2xl font-semibold tracking-tight">
            WenDui
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex h-14 items-end gap-8 text-sm font-medium text-muted-foreground">
              {navItems.map((item) => {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'group relative flex items-center pb-3 transition',
                        isActive ? 'text-foreground' : 'hover:text-foreground',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        <span
                          className={[
                            'absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground transition',
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                          ].join(' ')}
                        />
                      </>
                    )}
                  </NavLink>
                )
              })}
              {!isAuthed && (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    [
                      'group relative flex items-center pb-3 transition',
                      isActive ? 'text-foreground' : 'hover:text-foreground',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>Login</span>
                      <span
                        className={[
                          'absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground transition',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                        ].join(' ')}
                      />
                    </>
                  )}
                </NavLink>
              )}
            </nav>
            <div
              className="relative"
              onMouseEnter={() => setPanelOpen(true)}
              onMouseLeave={() => setPanelOpen(false)}
            >
              <button
                type="button"
                data-testid="account-trigger"
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: `hsl(${accent} 55% 55%)` }}
              >
                {initials}
              </button>
              {panelOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-2xl border border-border/60 bg-white p-4 text-sm shadow-lg">
                  <div className="text-xs text-muted-foreground">
                    {status === 'authenticated' ? email : '未登录'}
                  </div>
                  {status === 'authenticated' ? (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-full border border-border/70 px-3 py-2 text-sm text-foreground hover:bg-muted/60"
                      onClick={() => {
                        clearAuth()
                        navigate('/login')
                      }}
                    >
                      退出账号
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-full border border-border/70 px-3 py-2 text-sm text-foreground hover:bg-muted/60"
                      onClick={() => navigate('/login')}
                    >
                      去登录
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-[90%] flex-1 pb-20 pt-8">
        <Outlet />
      </main>
    </div>
  )
}
