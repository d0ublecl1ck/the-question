import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/store/hooks'
import { setAuth } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const extractErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data = (await response.json()) as { detail?: string }
      if (data?.detail) {
        return data.detail
      }
    } catch {
      // ignore invalid json
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
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          mode === 'login' ? '登录失败，请检查账号信息' : '注册失败，请稍后重试',
        )
        throw new Error(message)
      }
      const data = (await response.json()) as { access_token?: string }
      const resolveUser = async (token: string) => {
        const meResponse = await fetch('/api/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!meResponse.ok) {
          throw new Error('Fetch me failed')
        }
        return (await meResponse.json()) as { id: string; email: string }
      }

      if (mode === 'register') {
        const loginResponse = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!loginResponse.ok) {
          const message = await extractErrorMessage(loginResponse, '登录失败，请检查账号信息')
          throw new Error(message)
        }
        const loginData = (await loginResponse.json()) as { access_token: string }
        const user = await resolveUser(loginData.access_token)
        dispatch(setAuth({ token: loginData.access_token, user }))
      } else if (data.access_token) {
        const user = await resolveUser(data.access_token)
        dispatch(setAuth({ token: data.access_token, user }))
      }
      navigate('/')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error && err.message ? err.message : '登录失败，请检查账号信息')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section className="flex w-full flex-1 items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm text-center" data-testid="login-card">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900 text-white"
            data-testid="login-logo"
          >
            <span className="text-3xl font-semibold">W</span>
          </div>
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
            className="h-11 rounded-2xl text-sm"
          />
          <Input
            placeholder="密码"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-2xl text-sm"
          />
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
          <Button className="h-11 w-full rounded-full text-sm" onClick={submit} disabled={status === 'loading'}>
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
          继续即表示你同意我们的服务条款和隐私政策
        </p>
      </div>
    </section>
  )
}
