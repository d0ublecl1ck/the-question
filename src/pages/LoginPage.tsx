import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/store/hooks'
import { setAuth } from '@/store/slices/authSlice'
import { enqueueToast } from '@/store/slices/toastSlice'
import { useLoginWithProfileMutation, useRegisterWithProfileMutation } from '@/store/api/authApi'
import { Link, useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo.svg'

export default function LoginPage() {
  const navigate = useNavigate()
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
      navigate('/')
    } catch (err) {
      setStatus('error')
      const fallback = mode === 'login' ? '登录失败，请检查账号信息' : '注册失败，请稍后重试'
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
          <p className="text-sm text-muted-foreground">{'问对问题，遇见专家'}</p>
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
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="h-11 w-full rounded-[16px] text-sm"
            onClick={submit}
            disabled={status === 'loading' || isLoginLoading || isRegisterLoading}
          >
            {mode === 'login' ? '邮箱登录' : '邮箱注册'}
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>{mode === 'login' ? '还没有账号？' : '已有账号？'}</span>
          <button
            type="button"
            className="text-foreground hover:underline"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </div>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
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
    </section>
  )
}
