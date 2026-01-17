import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppDispatch } from '@/store/hooks'
import { enqueueToast } from '@/store/slices/toastSlice'
import {
  useDeleteMemoryMutation,
  useGetMeQuery,
  useGetMemoryQuery,
  useUpdateMeMutation,
  useUpdateMemoryMutation,
} from '@/store/api/settingsApi'

export default function SettingsPage() {
  const { data: profileData, isLoading: isProfileLoading, isError: isProfileError } = useGetMeQuery()
  const { data: memoryItems = [], isLoading: isMemoryLoading, isError: isMemoryError } =
    useGetMemoryQuery({ scope: 'user' })
  const [updateMe] = useUpdateMeMutation()
  const [updateMemoryMutation] = useUpdateMemoryMutation()
  const [deleteMemoryMutation] = useDeleteMemoryMutation()
  const dispatch = useAppDispatch()
  const profile = profileData ?? null
  const [email, setEmail] = useState('')
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryValue, setNewMemoryValue] = useState('')
  const [memoryDrafts, setMemoryDrafts] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [creatingMemory, setCreatingMemory] = useState(false)
  const [updatingMemoryIds, setUpdatingMemoryIds] = useState<string[]>([])
  const [deletingMemoryIds, setDeletingMemoryIds] = useState<string[]>([])
  const status: 'loading' | 'ready' | 'error' =
    isProfileError || isMemoryError ? 'error' : isProfileLoading || isMemoryLoading ? 'loading' : 'ready'
  const profileMemory = useMemo(() => {
    return memoryItems.find((item) => item.key === 'profile')?.value ?? ''
  }, [memoryItems])

  useEffect(() => {
    if (profile?.email) {
      setEmail(profile.email)
    }
  }, [profile?.email])

  useEffect(() => {
    if (!profileMemory) return
    setMemoryDrafts((prev) => {
      if (prev.profile) return prev
      return { ...prev, profile: profileMemory }
    })
  }, [profileMemory])

  const saveProfile = async () => {
    if (!profile) return
    setProfileSaving('saving')
    try {
      await updateMe({ email }).unwrap()
      setProfileSaving('saved')
      dispatch(enqueueToast('账号信息已保存'))
    } catch {
      setProfileSaving('error')
      dispatch(enqueueToast('账号信息保存失败'))
    }
  }

  const handleCreateMemory = async () => {
    const key = newMemoryKey.trim()
    const value = newMemoryValue.trim()
    if (!key || !value) return
    setCreatingMemory(true)
    try {
      await updateMemoryMutation({ key, value, scope: 'user' }).unwrap()
      setNewMemoryKey('')
      setNewMemoryValue('')
      dispatch(enqueueToast('偏好记忆已添加'))
    } catch {
      dispatch(enqueueToast('偏好记忆添加失败'))
    } finally {
      setCreatingMemory(false)
    }
  }

  const handleUpdateMemory = async (itemId: string, key: string, scope?: string | null) => {
    const nextValue = (memoryDrafts[key] ?? '').trim()
    if (!nextValue) {
      dispatch(enqueueToast('内容不能为空'))
      return
    }
    setUpdatingMemoryIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    try {
      await updateMemoryMutation({ key, value: nextValue, scope: scope ?? 'user' }).unwrap()
      dispatch(enqueueToast('偏好记忆已保存'))
    } catch {
      dispatch(enqueueToast('偏好记忆保存失败'))
    } finally {
      setUpdatingMemoryIds((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const handleDeleteMemory = async (itemId: string) => {
    setDeletingMemoryIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    try {
      await deleteMemoryMutation({ memoryId: itemId }).unwrap()
      dispatch(enqueueToast('偏好记忆已删除'))
    } catch {
      dispatch(enqueueToast('偏好记忆删除失败'))
    } finally {
      setDeletingMemoryIds((prev) => prev.filter((id) => id !== itemId))
    }
  }

  useEffect(() => {
    if (memoryItems.length === 0) return
    setMemoryDrafts((prev) => {
      const next = { ...prev }
      memoryItems.forEach((item) => {
        if (next[item.key] === undefined) {
          next[item.key] = item.value
        }
      })
      return next
    })
  }, [memoryItems])

  return (
    <section className="w-full space-y-12">
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
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">账号信息</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile</span>
            </div>
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
            <Button onClick={saveProfile} className="rounded-full" disabled={profileSaving === 'saving'}>
              {profileSaving === 'saving' ? '保存中...' : '保存账号信息'}
            </Button>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">偏好记忆</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Preferences
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              用自然语言描述你的语气、常用技能、背景偏好等。
            </p>
            <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">新增偏好</h4>
                  <p className="text-xs text-muted-foreground">每条偏好作为独立记忆项保存。</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
                <Input
                  value={newMemoryKey}
                  onChange={(event) => setNewMemoryKey(event.target.value)}
                  placeholder="偏好名称，如：语气偏好"
                />
                <Textarea
                  value={newMemoryValue}
                  onChange={(event) => setNewMemoryValue(event.target.value)}
                  className="min-h-[96px]"
                  placeholder="例如：偏好简洁回复；常用日报总结技能；熟悉前端与产品。"
                />
              </div>
              <Button
                onClick={handleCreateMemory}
                className="mt-3 rounded-full"
                disabled={creatingMemory || !newMemoryKey.trim() || !newMemoryValue.trim()}
              >
                {creatingMemory ? '添加中...' : '添加偏好'}
              </Button>
            </div>

            <div className="space-y-3">
              {memoryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
                  还没有偏好记忆，先添加第一条吧。
                </div>
              ) : (
                memoryItems.map((item) => {
                  const draftValue = memoryDrafts[item.key] ?? item.value
                  const isUpdating = updatingMemoryIds.includes(item.id)
                  const isDeleting = deletingMemoryIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline" className="rounded-full">
                            {item.key}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.scope ?? 'user'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMemory(item.id, item.key, item.scope)}
                            disabled={isUpdating || isDeleting}
                          >
                            {isUpdating ? '保存中...' : '保存修改'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMemory(item.id)}
                            disabled={isUpdating || isDeleting}
                          >
                            {isDeleting ? '删除中...' : '删除'}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={draftValue}
                        onChange={(event) =>
                          setMemoryDrafts((prev) => ({
                            ...prev,
                            [item.key]: event.target.value,
                          }))
                        }
                        className="mt-3 min-h-[110px]"
                      />
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
