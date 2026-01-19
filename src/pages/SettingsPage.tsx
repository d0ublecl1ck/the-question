import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { registerTranslations, setLanguage, supportedLanguages } from '@/lib/i18n'

registerTranslations('settings', {
  zh: {
    header: {
      label: 'Settings',
      title: '设置',
      description: '管理偏好记忆、默认技能与账号信息。',
    },
    language: {
      title: '语言设置',
      description: '切换界面语言后即时生效。',
    },
    profile: {
      title: '账号信息',
      label: 'Profile',
      email: '邮箱',
      role: '角色',
      save: '保存账号信息',
      saving: '保存中...',
    },
    memory: {
      title: '偏好记忆',
      label: 'Memory',
      description: '用自然语言描述你的语气、常用技能、背景偏好等。',
      searchPlaceholder: '搜索记忆',
      create: '新增记忆',
      creating: '添加中...',
      newPlaceholder: '新增一条偏好记忆，例如：偏好简洁回复；熟悉前端与产品。',
      empty: '暂无匹配的记忆内容。',
      update: '保存修改',
      updating: '保存中...',
      cancel: '取消',
      menuAria: '记忆操作',
      menuEdit: '编辑',
      menuCancel: '取消编辑',
      menuDelete: '删除',
    },
    toasts: {
      profileSaved: '账号信息已保存',
      profileSaveFailed: '账号信息保存失败',
      memoryAdded: '偏好记忆已添加',
      memoryAddFailed: '偏好记忆添加失败',
      memoryEmpty: '内容不能为空',
      memorySaved: '偏好记忆已保存',
      memorySaveFailed: '偏好记忆保存失败',
      memoryDeleted: '偏好记忆已删除',
      memoryDeleteFailed: '偏好记忆删除失败',
    },
  },
  en: {
    header: {
      label: 'Settings',
      title: 'Settings',
      description: 'Manage preference memory, default skills, and account info.',
    },
    language: {
      title: 'Language preferences',
      description: 'Changes take effect immediately.',
    },
    profile: {
      title: 'Account',
      label: 'Profile',
      email: 'Email',
      role: 'Role',
      save: 'Save account',
      saving: 'Saving...',
    },
    memory: {
      title: 'Preference memory',
      label: 'Memory',
      description: 'Describe your tone, preferred skills, background, and more.',
      searchPlaceholder: 'Search memory',
      create: 'Add memory',
      creating: 'Adding...',
      newPlaceholder: 'Add a preference memory, e.g., concise replies; strong in frontend & product.',
      empty: 'No matching memories.',
      update: 'Save changes',
      updating: 'Saving...',
      cancel: 'Cancel',
      menuAria: 'Memory actions',
      menuEdit: 'Edit',
      menuCancel: 'Cancel edit',
      menuDelete: 'Delete',
    },
    toasts: {
      profileSaved: 'Account saved.',
      profileSaveFailed: 'Failed to save account.',
      memoryAdded: 'Memory added.',
      memoryAddFailed: 'Failed to add memory.',
      memoryEmpty: 'Content cannot be empty.',
      memorySaved: 'Memory saved.',
      memorySaveFailed: 'Failed to save memory.',
      memoryDeleted: 'Memory deleted.',
      memoryDeleteFailed: 'Failed to delete memory.',
    },
  },
})

export default function SettingsPage() {
  const { t } = useTranslation('settings')
  const { t: tCommon, i18n } = useTranslation('common')
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
  const currentLanguage = i18n.language
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
      dispatch(enqueueToast(t('toasts.profileSaved')))
    } catch {
      setProfileSaving('error')
      dispatch(enqueueToast(t('toasts.profileSaveFailed')))
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
      dispatch(enqueueToast(t('toasts.memoryAdded')))
    } catch {
      dispatch(enqueueToast(t('toasts.memoryAddFailed')))
    } finally {
      setCreatingMemory(false)
    }
  }

  const handleUpdateMemory = async (itemId: string, key: string, scope?: string | null) => {
    const nextValue = (memoryDrafts[itemId] ?? '').trim()
    if (!nextValue) {
      dispatch(enqueueToast(t('toasts.memoryEmpty')))
      return
    }
    setUpdatingMemoryIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    try {
      await updateMemoryMutation({ key, value: nextValue, scope: scope ?? 'user' }).unwrap()
      dispatch(enqueueToast(t('toasts.memorySaved')))
      setEditingId(null)
    } catch {
      dispatch(enqueueToast(t('toasts.memorySaveFailed')))
    } finally {
      setUpdatingMemoryIds((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const handleDeleteMemory = async (itemId: string) => {
    setDeletingMemoryIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    try {
      await deleteMemoryMutation({ memoryId: itemId }).unwrap()
      dispatch(enqueueToast(t('toasts.memoryDeleted')))
    } catch {
      dispatch(enqueueToast(t('toasts.memoryDeleteFailed')))
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
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t('header.label')}</p>
        <h2 className="text-3xl font-semibold">{t('header.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('header.description')}</p>
      </header>

      {status === 'error' ? (
        <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {tCommon('status.loadFailed')}
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{t('language.title')}</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {tCommon('language.label')}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {tCommon('language.label')}
                </label>
                <select
                  value={currentLanguage}
                  onChange={(event) => {
                    void setLanguage(event.target.value)
                  }}
                  className="h-10 w-full rounded-full border border-border/60 bg-white px-4 text-sm text-foreground"
                >
                  {supportedLanguages.map((code) => (
                    <option key={code} value={code}>
                      {tCommon(`language.options.${code}`)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-muted-foreground">{t('language.description')}</p>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{t('profile.title')}</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('profile.label')}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t('profile.email')}
                </label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t('profile.role')}
                </label>
                <Input value={profile?.role ?? ''} disabled />
              </div>
            </div>
            <Button onClick={saveProfile} className="rounded-full" disabled={profileSaving === 'saving'}>
              {profileSaving === 'saving' ? t('profile.saving') : t('profile.save')}
            </Button>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{t('memory.title')}</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('memory.label')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('memory.description')}
            </p>
            <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={memoryQuery}
                    onChange={(event) => setMemoryQuery(event.target.value)}
                    placeholder={t('memory.searchPlaceholder')}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleCreateMemory}
                  className="rounded-full"
                  disabled={creatingMemory || !newMemoryValue.trim()}
                >
                  {creatingMemory ? t('memory.creating') : t('memory.create')}
                </Button>
              </div>
              <Textarea
                value={newMemoryValue}
                onChange={(event) => setNewMemoryValue(event.target.value)}
                className="mt-3 min-h-[96px]"
                placeholder={t('memory.newPlaceholder')}
              />
            </div>

            <div className="space-y-3">
              {filteredMemoryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
                  {t('memory.empty')}
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
                              {isUpdating ? t('memory.updating') : t('memory.update')}
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
                              {t('memory.cancel')}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                            aria-label={t('memory.menuAria')}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingId((prev) => (prev === item.id ? null : item.id))}
                            disabled={isDeleting || isUpdating}
                          >
                            {isEditing ? t('memory.menuCancel') : t('memory.menuEdit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMemory(item.id)}
                            disabled={isDeleting || isUpdating}
                          >
                            {t('memory.menuDelete')}
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
