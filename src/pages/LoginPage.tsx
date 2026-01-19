import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch } from '@/store/hooks'
import { setAuth } from '@/store/slices/authSlice'
import { enqueueAlert } from '@/store/slices/alertSlice'
import { useLoginWithProfileMutation, useRegisterWithProfileMutation } from '@/store/api/authApi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo.svg'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [loginWithProfile, { isLoading: isLoginLoading }] = useLoginWithProfileMutation()
  const [registerWithProfile, { isLoading: isRegisterLoading }] = useRegisterWithProfileMutation()

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  useEffect(() => {
    if (typeof document === 'undefined') return
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
    }
  }, [])

  const extractErrorMessage = (payload: unknown, fallback: string) => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const data = (payload as { data?: { detail?: string } }).data
      if (data?.detail) {
        return data.detail
      }
    }
    return fallback
  }

  const submit = async () => {
    if (!email.trim() || !password.trim()) return
    if (!isValidEmail(email)) {
      setStatus('error')
      setError('请输入有效的邮箱地址')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const result =
        mode === 'login'
          ? await loginWithProfile({ email, password }).unwrap()
          : await registerWithProfile({ email, password }).unwrap()
      dispatch(setAuth({ token: result.token, user: result.user }))
      const redirectTarget =
        location.state && typeof location.state === 'object' && 'from' in location.state
          ? (location.state as { from?: { pathname?: string; search?: string; hash?: string; state?: unknown } })
              .from
          : null
      if (redirectTarget?.pathname) {
        navigate(
          {
            pathname: redirectTarget.pathname,
            search: redirectTarget.search ?? '',
            hash: redirectTarget.hash ?? '',
          },
          { replace: true, state: redirectTarget.state },
        )
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setStatus('error')
      const fallback = mode === 'login' ? '登录失败，请检查账号信息' : '注册失败，请稍后重试'
      const message = extractErrorMessage(err, fallback)
      setError('')
      dispatch(enqueueAlert({ description: message, variant: 'destructive' }))
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section
      className="flex w-full flex-1 items-center justify-center px-6 py-10"
      data-testid="login-page"
    >
      <div
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border bg-background shadow-sm md:min-h-[560px] md:flex-row"
        data-testid="login-shell"
      >
        <aside
          className="relative flex w-full flex-col justify-between gap-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 md:w-[52%] md:p-12"
          data-testid="login-brand-panel"
        >
          <span
            className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-slate-200/70 blur-3xl"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <h1 className="text-3xl font-semibold tracking-tight" data-testid="login-brand">
                  WenDui
                </h1>
                <p className="text-sm text-muted-foreground">{'问对问题，遇见专家'}</p>
              </div>
              <img
                src={logoUrl}
                alt="WenDui"
                className="h-40 w-40 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/80"
                data-testid="login-logo"
              />
            </div>
            <p
              className="max-w-sm self-end text-sm leading-relaxed text-slate-600"
              data-testid="login-brand-copy"
            >
              让每一次提问都有更好的答案，用更清晰的表达连接真实的专业价值。
            </p>
            <div className="grid gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                <span>多维度专家画像，精准匹配你的需求</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                <span>问题拆解建议，帮你快速聚焦关键点</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                <span>私密沟通环境，保护你的隐私和权益</span>
              </div>
            </div>
          </div>
          <p className="relative z-10 text-xs text-slate-500">
            安全登录 · 隐私保护 · 秒速连接
          </p>
        </aside>

        <div className="flex w-full flex-1 items-center justify-center bg-background p-8 md:p-12">
          <div className="w-full max-w-sm text-left" data-testid="login-card">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </p>
              <h2 className="text-2xl font-semibold">
                {mode === 'login' ? '邮箱登录' : '邮箱注册'}
              </h2>
            </div>

            <div className="mt-8 space-y-3">
              <Input
                placeholder="邮箱"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-[16px] text-sm"
              />
              <Input
                placeholder="密码"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-[16px] text-sm"
              />
              {status === 'error' && error ? (
                <Alert variant="destructive" className="py-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                className="h-11 w-full rounded-[16px] text-sm"
                onClick={submit}
                disabled={status === 'loading' || isLoginLoading || isRegisterLoading}
              >
                {mode === 'login' ? '邮箱登录' : '邮箱注册'}
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{mode === 'login' ? '还没有账号？' : '已有账号？'}</span>
              <button
                type="button"
                className="text-foreground hover:underline"
                onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
              >
                {mode === 'login' ? '去注册' : '去登录'}
              </button>
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">
              继续即表示你同意我们的
              <Link className="font-medium text-foreground hover:underline" to="/terms">
                服务条款
              </Link>
              和
              <Link className="font-medium text-foreground hover:underline" to="/privacy">
                隐私政策
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
