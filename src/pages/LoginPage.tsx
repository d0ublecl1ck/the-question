import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim() || !password.trim()) return
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
        throw new Error('Request failed')
      }
      const data = (await response.json()) as { access_token?: string; user?: { id: string; email: string } }
      if (mode === 'register') {
        const loginResponse = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!loginResponse.ok) {
          throw new Error('Login failed')
        }
        const loginData = (await loginResponse.json()) as { access_token: string; user: { id: string; email: string } }
        setAuth({ token: loginData.access_token, user: loginData.user })
      } else if (data.access_token && data.user) {
        setAuth({ token: data.access_token, user: data.user })
      }
      navigate('/')
    } catch (err) {
      setStatus('error')
      setError(mode === 'login' ? '登录失败，请检查账号信息' : '注册失败，请稍后重试')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-glow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{mode === 'login' ? '登录' : '注册'}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">登录后同步记忆与个人技能库。</p>
        <div className="mt-6 space-y-4">
          <Input placeholder="邮箱" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            placeholder="密码"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={status === 'loading'}>
            {status === 'loading' ? '处理中...' : '进入工作台'}
          </Button>
        </div>
      </div>
    </section>
  )
}
