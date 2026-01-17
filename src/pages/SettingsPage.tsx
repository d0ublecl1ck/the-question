import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAppDispatch } from '@/store/hooks'
import { enqueueToast } from '@/store/slices/toastSlice'
import {
  useDeleteMemoryMutation,
  useGetMeQuery,
  useGetMemoryQuery,
  useUpdateMeMutation,
  useUpdateMemoryMutation,
} from '@/store/api/settingsApi'
import { MoreHorizontal, Search } from 'lucide-react'

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
  const [newMemoryValue, setNewMemoryValue] = useState('')
  const [memoryDrafts, setMemoryDrafts] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [creatingMemory, setCreatingMemory] = useState(false)
  const [updatingMemoryIds, setUpdatingMemoryIds] = useState<string[]>([])
  const [deletingMemoryIds, setDeletingMemoryIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [memoryQuery, setMemoryQuery] = useState('')
  const status: 'loading' | 'ready' | 'error' =
    isProfileError || isMemoryError ? 'error' : isProfileLoading || isMemoryLoading ? 'loading' : 'ready'
  useEffect(() => {
    if (profile?.email) {
      setEmail(profile.email)
    }
  }, [profile?.email])

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
    const value = newMemoryValue.trim()
    if (!value) return
    const key = `pref-${Date.now()}`
    setCreatingMemory(true)
    try {
      await updateMemoryMutation({ key, value, scope: 'user' }).unwrap()
      setNewMemoryValue('')
      dispatch(enqueueToast('偏好记忆已添加'))
    } catch {
      dispatch(enqueueToast('偏好记忆添加失败'))
    } finally {
      setCreatingMemory(false)
    }
  }

  const handleUpdateMemory = async (itemId: string, key: string, scope?: string | null) => {
    const nextValue = (memoryDrafts[itemId] ?? '').trim()
    if (!nextValue) {
      dispatch(enqueueToast('内容不能为空'))
      return
    }
    setUpdatingMemoryIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    try {
      await updateMemoryMutation({ key, value: nextValue, scope: scope ?? 'user' }).unwrap()
      dispatch(enqueueToast('偏好记忆已保存'))
      setEditingId(null)
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
        if (next[item.id] === undefined) {
          next[item.id] = item.value
        }
      })
      return next
    })
  }, [memoryItems])

  const filteredMemoryItems = useMemo(() => {
    const keyword = memoryQuery.trim().toLowerCase()
    if (!keyword) return memoryItems
    return memoryItems.filter((item) => {
      const value = item.value.toLowerCase()
      const key = item.key.toLowerCase()
      return value.includes(keyword) || key.includes(keyword)
    })
  }, [memoryItems, memoryQuery])

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
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={memoryQuery}
                    onChange={(event) => setMemoryQuery(event.target.value)}
                    placeholder="搜索记忆"
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleCreateMemory}
                  className="rounded-full"
                  disabled={creatingMemory || !newMemoryValue.trim()}
                >
                  {creatingMemory ? '添加中...' : '新增记忆'}
                </Button>
              </div>
              <Textarea
                value={newMemoryValue}
                onChange={(event) => setNewMemoryValue(event.target.value)}
                className="mt-3 min-h-[96px]"
                placeholder="新增一条偏好记忆，例如：偏好简洁回复；熟悉前端与产品。"
              />
            </div>

            <div className="space-y-3">
              {filteredMemoryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
                  暂无匹配的记忆内容。
                </div>
              ) : (
                filteredMemoryItems.map((item) => {
                  const draftValue = memoryDrafts[item.id] ?? item.value
                  const isUpdating = updatingMemoryIds.includes(item.id)
                  const isDeleting = deletingMemoryIds.includes(item.id)
                  const isEditing = editingId === item.id
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm"
                    >
                      <div className="flex-1">
                        {isEditing ? (
                          <Textarea
                            value={draftValue}
                            onChange={(event) =>
                              setMemoryDrafts((prev) => ({
                                ...prev,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="min-h-[96px]"
                          />
                        ) : (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {item.value}
                          </p>
                        )}
                        {isEditing ? (
                          <div className="mt-3 flex flex-wrap gap-2">
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
                              onClick={() => {
                                setMemoryDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: item.value,
                                }))
                                setEditingId(null)
                              }}
                              disabled={isUpdating || isDeleting}
                            >
                              取消
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                            aria-label="记忆操作"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingId((prev) => (prev === item.id ? null : item.id))}
                            disabled={isDeleting || isUpdating}
                          >
                            {isEditing ? '取消编辑' : '编辑'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMemory(item.id)}
                            disabled={isDeleting || isUpdating}
                          >
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
