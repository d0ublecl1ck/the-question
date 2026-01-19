import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearAuth } from '@/store/slices/authSlice'
import { registerTranslations, setLanguage, supportedLanguages } from '@/lib/i18n'
import logoUrl from '@/assets/logo.svg'
import avatarUrl from '@/assets/avatar.jpg'

registerTranslations('appShell', {
  zh: {
    nav: {
      home: '首页',
      market: '专家广场',
      about: '关于',
      price: '定价',
      chat: '对话',
      login: '登录',
    },
    panel: {
      anonymous: '未登录',
      settings: '设置',
      logout: '退出账号',
      loginCta: '去登录',
    },
    labels: {
      avatarAlt: '头像',
    },
  },
  en: {
    nav: {
      home: 'Home',
      market: 'Expert Plaza',
      about: 'About',
      price: 'Pricing',
      chat: 'Chat',
      login: 'Log in',
    },
    panel: {
      anonymous: 'Not signed in',
      settings: 'Settings',
      logout: 'Log out',
      loginCta: 'Log in',
    },
    labels: {
      avatarAlt: 'Avatar',
    },
  },
})

export default function AppShell() {
  const { t } = useTranslation('appShell')
  const { t: tCommon, i18n } = useTranslation('common')
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.auth.status)
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const location = useLocation()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isAuthed = status === 'authenticated'
  const publicNavItems = [
    { to: '/', label: t('nav.home') },
    { to: '/market', label: t('nav.market') },
    { to: '/about', label: t('nav.about') },
    { to: '/price', label: t('nav.price') },
  ]
  const authedNavItems = [
    { to: '/', label: t('nav.home') },
    { to: '/chat', label: t('nav.chat') },
    { to: '/market', label: t('nav.market') },
  ]
  const navItems = isAuthed ? authedNavItems : publicNavItems
  const email = user?.email ?? ''
  const isChatRoute = location.pathname.startsWith('/chat')
  const currentLanguage = i18n.language
  const mainClassName = [
    'mx-auto flex w-full flex-1 justify-center',
    isChatRoute
      ? 'h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden px-0 py-6'
      : 'min-h-[calc(100vh-3.5rem)] px-[5%] pb-20 pt-8',
  ].join(' ')

  useEffect(() => {
    if (!panelOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current) return
      if (panelRef.current.contains(event.target as Node)) return
      setPanelOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [panelOpen])

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
                      <span>{t('nav.login')}</span>
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
            <div className="relative" ref={panelRef}>
              <button
                type="button"
                data-testid="account-trigger"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
                onClick={() => setPanelOpen((open) => !open)}
                aria-expanded={panelOpen}
                aria-haspopup="menu"
              >
                <img src={avatarUrl} alt={t('labels.avatarAlt')} className="h-full w-full object-cover" />
              </button>
              {panelOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-2xl border border-border/60 bg-white p-4 text-sm shadow-lg">
                  <div className="text-xs text-muted-foreground">
                    {status === 'authenticated' ? email : t('panel.anonymous')}
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {tCommon('language.label')}
                    </label>
                    <select
                      aria-label={tCommon('language.label')}
                      value={currentLanguage}
                      onChange={(event) => {
                        void setLanguage(event.target.value)
                      }}
                      className="h-8 w-full rounded-full border border-border/60 bg-white px-3 text-xs text-foreground"
                    >
                      {supportedLanguages.map((code) => (
                        <option key={code} value={code}>
                          {tCommon(`language.options.${code}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {status === 'authenticated' ? (
                    <>
                      <Link
                        to="/settings"
                        className="mt-3 block w-full rounded-full border border-border/70 px-3 py-2 text-center text-sm text-foreground hover:bg-muted/60"
                      >
                        {t('panel.settings')}
                      </Link>
                      <button
                        type="button"
                        className="mt-2 w-full rounded-full border border-border/70 px-3 py-2 text-sm text-foreground hover:bg-muted/60"
                        onClick={() => {
                          dispatch(clearAuth())
                          navigate('/login')
                        }}
                      >
                        {t('panel.logout')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-full border border-border/70 px-3 py-2 text-sm text-foreground hover:bg-muted/60"
                      onClick={() => navigate('/login')}
                    >
                      {t('panel.loginCta')}
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
