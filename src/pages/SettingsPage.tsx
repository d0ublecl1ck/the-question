import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { authFetch } from '@/services/http'

type MeProfile = {
  id: string
  email: string
  is_active: boolean
  role: string
}

type MemoryItem = {
  id: string
  key: string
  value: string
  scope?: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<MeProfile | null>(null)
  const [email, setEmail] = useState('')
  const [memory, setMemory] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [meResponse, memoryResponse] = await Promise.all([
          authFetch('/api/v1/me'),
          authFetch('/api/v1/me/memory?scope=user'),
        ])
        if (!meResponse.ok || !memoryResponse.ok) {
          throw new Error('Request failed')
        }
        const meData = (await meResponse.json()) as MeProfile
        const memoryData = (await memoryResponse.json()) as MemoryItem[]
        if (!alive) return
        setProfile(meData)
        setEmail(meData.email)
        const profileMemory = memoryData.find((item) => item.key === 'profile')
        setMemory(profileMemory?.value ?? '')
        setStatus('ready')
      } catch (error) {
        if (!alive) return
        setStatus('error')
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const saveProfile = async () => {
    if (!profile) return
    setSaving('saving')
    try {
      const response = await authFetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        throw new Error('Request failed')
      }
      const updated = (await response.json()) as MeProfile
      setProfile(updated)
      setSaving('saved')
    } catch (error) {
      setSaving('error')
    }
  }

  const saveMemory = async () => {
    setSaving('saving')
    try {
      const response = await authFetch('/api/v1/me/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'profile', value: memory, scope: 'user' }),
      })
      if (!response.ok) {
        throw new Error('Request failed')
      }
      setSaving('saved')
    } catch (error) {
      setSaving('error')
    }
  }

  return (
    <section className="space-y-8 rounded-3xl border border-border/70 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 p-6 shadow-glow backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h2 className="text-3xl font-semibold">设置</h2>
        <p className="text-sm text-muted-foreground">管理偏好记忆、默认技能与账号信息。</p>
      </header>

      {status === 'error' ? (
        <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          加载失败，请稍后重试
        </div>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-5">
            <h3 className="text-lg font-semibold">账号信息</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">角色</label>
                <Input value={profile?.role ?? ''} disabled />
              </div>
            </div>
            <Button onClick={saveProfile} className="rounded-full" disabled={saving === 'saving'}>
              {saving === 'saving' ? '保存中...' : '保存账号信息'}
            </Button>
          </section>

          <Separator />

          <section className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-5">
            <h3 className="text-lg font-semibold">偏好记忆</h3>
            <p className="text-sm text-muted-foreground">
              用自然语言描述你的语气、常用技能、背景偏好等。
            </p>
            <Textarea
              value={memory}
              onChange={(event) => setMemory(event.target.value)}
              className="min-h-[140px]"
              placeholder="例如：偏好简洁回复；常用日报总结技能；熟悉前端与产品。"
            />
            <Button onClick={saveMemory} className="rounded-full" disabled={saving === 'saving'}>
              {saving === 'saving' ? '保存中...' : '保存偏好记忆'}
            </Button>
          </section>

          <Separator />

          <section className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-5">
            <h3 className="text-lg font-semibold">默认技能</h3>
            <p className="text-sm text-muted-foreground">
              选择默认注入的技能（即将接入）。
            </p>
            <Button variant="outline" className="rounded-full" disabled>
              选择默认技能
            </Button>
          </section>
        </>
      )}
    </section>
  )
}
