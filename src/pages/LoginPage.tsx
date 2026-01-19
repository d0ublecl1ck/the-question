import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/store/hooks'
import { setAuth } from '@/store/slices/authSlice'
import { enqueueToast } from '@/store/slices/toastSlice'
import { useLoginWithProfileMutation, useRegisterWithProfileMutation } from '@/store/api/authApi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo.svg'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('login', {
  zh: {
    tagline: '问对问题，遇见专家',
    fields: {
      email: '邮箱',
      password: '密码',
    },
    errors: {
      invalidEmail: '请输入有效的邮箱地址',
    },
    actions: {
      login: '邮箱登录',
      register: '邮箱注册',
    },
    toggle: {
      noAccount: '还没有账号？',
      hasAccount: '已有账号？',
      goRegister: '去注册',
      goLogin: '去登录',
    },
    legal: {
      prefix: '继续即表示你同意我们的',
      terms: '服务条款',
      and: '和',
      privacy: '隐私政策',
    },
    toasts: {
      loginFailed: '登录失败，请检查账号信息',
      registerFailed: '注册失败，请稍后重试',
    },
  },
  en: {
    tagline: 'Ask the right questions, meet the experts',
    fields: {
      email: 'Email',
      password: 'Password',
    },
    errors: {
      invalidEmail: 'Please enter a valid email address.',
    },
    actions: {
      login: 'Sign in with email',
      register: 'Sign up with email',
    },
    toggle: {
      noAccount: 'No account yet?',
      hasAccount: 'Already have an account?',
      goRegister: 'Create one',
      goLogin: 'Sign in',
    },
    legal: {
      prefix: 'By continuing, you agree to our',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
    },
    toasts: {
      loginFailed: 'Login failed. Please check your credentials.',
      registerFailed: 'Registration failed. Please try again.',
    },
  },
})

export default function LoginPage() {
  const { t } = useTranslation('login')
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
      setError(t('errors.invalidEmail'))
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
      const fallback =
        mode === 'login' ? t('toasts.loginFailed') : t('toasts.registerFailed')
      const message = extractErrorMessage(err, fallback)
      setError('')
      dispatch(enqueueToast(message))
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section className="flex w-full flex-1 items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm text-center" data-testid="login-card">
        <div className="flex flex-col items-center gap-3">
          <img
            src={logoUrl}
            alt="WenDui"
            className="h-40 w-40 rounded-3xl"
            data-testid="login-logo"
          />
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="login-brand">
            WenDui
          </h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </div>

        <div className="mt-8 space-y-3">
          <Input
            placeholder={t('fields.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-[16px] text-sm"
          />
          <Input
            placeholder={t('fields.password')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-[16px] text-sm"
          />
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="h-11 w-full rounded-[16px] text-sm"
            onClick={submit}
            disabled={status === 'loading' || isLoginLoading || isRegisterLoading}
          >
            {mode === 'login' ? t('actions.login') : t('actions.register')}
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>{mode === 'login' ? t('toggle.noAccount') : t('toggle.hasAccount')}</span>
          <button
            type="button"
            className="text-foreground hover:underline"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? t('toggle.goRegister') : t('toggle.goLogin')}
          </button>
        </div>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          {t('legal.prefix')}
          <Link className="font-medium text-foreground hover:underline" to="/terms">
            {t('legal.terms')}
          </Link>
          {t('legal.and')}
          <Link className="font-medium text-foreground hover:underline" to="/privacy">
            {t('legal.privacy')}
          </Link>
        </p>
      </div>
    </section>
  )
}
