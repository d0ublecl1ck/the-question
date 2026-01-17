import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearAuth } from '@/store/slices/authSlice'
import logoUrl from '@/assets/logo.svg'

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
  { to: '/settings', label: 'Settings' },
]

export default function AppShell() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.auth.status)
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const location = useLocation()
  const [panelOpen, setPanelOpen] = useState(false)
  const isAuthed = status === 'authenticated'
  const navItems = isAuthed ? authedNavItems : publicNavItems
  const email = user?.email ?? ''
  const avatarSeed = email || 'anonymous'
  const accent = Array.from(avatarSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
  const initials = email ? email.slice(0, 1).toUpperCase() : '?'
  const isChatRoute = location.pathname.startsWith('/chat')
  const mainClassName = [
    'mx-auto flex w-full flex-1 justify-center px-[5%]',
    isChatRoute
      ? 'h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden py-6'
      : 'min-h-[calc(100vh-3.5rem)] pb-20 pt-8',
  ].join(' ')

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between gap-6 px-6">
          <Link to="/" className="flex h-14 items-center gap-3 text-2xl font-semibold tracking-tight">
            <img src={logoUrl} alt="WenDui" className="h-8 w-8" />
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
                        dispatch(clearAuth())
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

      <main className={mainClassName}>
        <Outlet />
      </main>
    </div>
  )
}
