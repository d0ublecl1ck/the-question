import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppDispatch } from '@/store/hooks'
import { enqueueToast } from '@/store/slices/toastSlice'
import { useListAiModelsQuery } from '@/store/api/aiApi'
import { useCreateChatSessionMutation, useDeleteChatSessionMutation } from '@/store/api/chatApi'
import { streamAiChat } from '@/store/api/aiStream'
import { useCreateSkillMutation, useCreateVersionMutation, useLazyGetSkillDetailQuery, useUpdateSkillMutation } from '@/store/api/skillsApi'
import type { SkillDetail } from '@/store/api/types'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('skillForm', {
  zh: {
    dialog: {
      createTitle: '新建技能',
      editTitle: '编辑技能',
      createDescription: '填写基础信息与内容后创建技能。',
      editDescription: '更新信息并生成新版本。',
    },
    status: {
      loadingDetail: '正在加载详情...',
    },
    fields: {
      name: '名称',
      visibility: '可见性',
      description: '描述（可为空）',
      tags: '标签（逗号分隔，可为空）',
      avatar: 'Avatar（可选）',
      content: '内容',
    },
    visibility: {
      public: '公开',
      private: '私有',
    },
    placeholders: {
      aiGenerated: '留空将由 AI 生成',
      avatar: '图片链接或 data URL',
      content: '粘贴或编写 Skill 内容',
    },
    actions: {
      save: '保存',
      saving: '保存中...',
    },
    toasts: {
      loadFailed: '加载技能详情失败',
      aiFailed: 'AI 生成失败，请补充描述与标签',
      emptyFields: '名称与内容不能为空',
      created: '技能已创建',
      updated: '技能已更新',
      saveFailed: '保存失败，请稍后重试',
    },
    prompt: {
      sessionTitle: 'Skill Meta',
      lines: [
        '你是产品经理，请根据以下 Skill 内容生成 JSON：',
        '- description: 80 字以内中文描述',
        '- tags: 3~6 个中文标签（短词）',
        '输出严格 JSON，不要添加多余文本。',
      ],
    },
  },
  en: {
    dialog: {
      createTitle: 'New skill',
      editTitle: 'Edit skill',
      createDescription: 'Fill in the basics and content to create a skill.',
      editDescription: 'Update details and generate a new version.',
    },
    status: {
      loadingDetail: 'Loading details...',
    },
    fields: {
      name: 'Name',
      visibility: 'Visibility',
      description: 'Description (optional)',
      tags: 'Tags (comma-separated, optional)',
      avatar: 'Avatar (optional)',
      content: 'Content',
    },
    visibility: {
      public: 'Public',
      private: 'Private',
    },
    placeholders: {
      aiGenerated: 'Leave blank to generate with AI',
      avatar: 'Image URL or data URL',
      content: 'Paste or write the Skill content',
    },
    actions: {
      save: 'Save',
      saving: 'Saving...',
    },
    toasts: {
      loadFailed: 'Failed to load skill details.',
      aiFailed: 'AI generation failed. Please add description and tags.',
      emptyFields: 'Name and content are required.',
      created: 'Skill created.',
      updated: 'Skill updated.',
      saveFailed: 'Save failed. Please try again.',
    },
    prompt: {
      sessionTitle: 'Skill Meta',
      lines: [
        'You are a product manager. Generate JSON from the following Skill content:',
        '- description: English description within 80 words',
        '- tags: 3–6 short English tags',
        'Output strict JSON only, no extra text.',
      ],
    },
  },
})

type SkillFormDialogProps = {
  mode: 'create' | 'edit'
  skillId?: string | null
  triggerLabel: string
  triggerVariant?: 'default' | 'outline' | 'ghost'
  triggerSize?: 'default' | 'sm' | 'lg'
  triggerClassName?: string
  onCompleted?: () => void
}

const defaultTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

const normalizeVisibility = (value: string) => (value === 'private' ? 'private' : 'public')

export default function SkillFormDialog({
  mode,
  skillId,
  triggerLabel,
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerClassName,
  onCompleted,
}: SkillFormDialogProps) {
  const { t } = useTranslation('skillForm')
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [avatar, setAvatar] = useState('')
  const [content, setContent] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [createSkill] = useCreateSkillMutation()
  const [updateSkill] = useUpdateSkillMutation()
  const [createVersion] = useCreateVersionMutation()
  const [createSession] = useCreateChatSessionMutation()
  const [deleteSession] = useDeleteChatSessionMutation()
  const { data: models = [] } = useListAiModelsQuery()
  const [fetchSkillDetail] = useLazyGetSkillDetailQuery()
  const modelId = useMemo(() => models[0]?.id ?? null, [models])

  const resetForm = () => {
    setName('')
    setDescription('')
    setTagsInput('')
    setVisibility('public')
    setAvatar('')
    setContent('')
    setDetail(null)
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'create') {
      resetForm()
      return
    }
    if (!skillId) return
    let active = true
    const loadDetail = async () => {
      setLoadingDetail(true)
      try {
        const detail = await fetchSkillDetail(skillId).unwrap()
        if (!active) return
        setName(detail.name ?? '')
        setDescription(detail.description ?? '')
        setTagsInput(detail.tags?.join(', ') ?? '')
        setVisibility(normalizeVisibility(detail.visibility ?? 'public'))
        setAvatar(detail.avatar ?? '')
        setContent(detail.content ?? '')
        setDetail(detail)
      } catch {
        if (active) {
          dispatch(enqueueToast(t('toasts.loadFailed')))
          setOpen(false)
        }
      } finally {
        if (active) setLoadingDetail(false)
      }
    }
    loadDetail()
    return () => {
      active = false
    }
  }, [dispatch, fetchSkillDetail, mode, open, skillId])

  const generateMeta = async (rawContent: string) => {
    if (!modelId) {
      throw new Error('AI model not available')
    }
    const session = await createSession({ title: t('prompt.sessionTitle') }).unwrap()
    let responseText = ''
    try {
      const promptLines = t('prompt.lines', { returnObjects: true }) as string[]
      const prompt = [...promptLines, '', rawContent].join('\n')
      await streamAiChat(
        { sessionId: session.id, content: prompt, model: modelId },
        { onDelta: (delta, _messageId) => (responseText += delta) },
      )
      const start = responseText.indexOf('{')
      const end = responseText.lastIndexOf('}')
      const jsonText = start !== -1 && end !== -1 ? responseText.slice(start, end + 1) : responseText
      const parsed = JSON.parse(jsonText) as { description?: string; tags?: string[] }
      return {
        description: parsed.description?.trim() ?? '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      }
    } finally {
      await deleteSession(session.id)
    }
  }

  const ensureMeta = async () => {
    const currentTags = defaultTags(tagsInput)
    const needsDescription = description.trim().length === 0
    const needsTags = currentTags.length === 0
    if (!needsDescription && !needsTags) {
      return { description: description.trim(), tags: currentTags }
    }
    try {
      const generated = await generateMeta(content.trim())
      const nextDescription = needsDescription ? generated.description : description.trim()
      const nextTags = needsTags ? generated.tags : currentTags
      if (!nextDescription || nextTags.length === 0) {
        throw new Error('AI response incomplete')
      }
      setDescription(nextDescription)
      setTagsInput(nextTags.join(', '))
      return { description: nextDescription, tags: nextTags }
    } catch {
      dispatch(enqueueToast(t('toasts.aiFailed')))
      const error = new Error('meta generation failed')
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      dispatch(enqueueToast(t('toasts.emptyFields')))
      return
    }
    setSaving(true)
    try {
      const meta = await ensureMeta()
      const payload = {
        name: name.trim(),
        description: meta.description,
        tags: meta.tags,
        visibility,
        avatar: avatar.trim() || null,
      }

      if (mode === 'create') {
        await createSkill({ ...payload, content: content.trim() }).unwrap()
        dispatch(enqueueToast(t('toasts.created')))
      } else if (skillId) {
        const tasks: Promise<unknown>[] = []
        tasks.push(updateSkill({ skillId, ...payload }).unwrap())
        if (detail?.content !== content.trim()) {
          tasks.push(createVersion({ skillId, content: content.trim() }).unwrap())
        }
        await Promise.all(tasks)
        dispatch(enqueueToast(t('toasts.updated')))
      }
      setOpen(false)
      onCompleted?.()
    } catch (error) {
      if (error instanceof Error && error.message === 'meta generation failed') {
        return
      }
      if (open) dispatch(enqueueToast(t('toasts.saveFailed')))
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? t('dialog.createTitle') : t('dialog.editTitle')
  const descriptionText =
    mode === 'create' ? t('dialog.createDescription') : t('dialog.editDescription')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={['rounded-full', triggerClassName].filter(Boolean).join(' ')}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        {loadingDetail ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
            {t('status.loadingDetail')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t('fields.name')}
                </label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t('fields.visibility')}
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={visibility === 'public' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setVisibility('public')}
                  >
                    {t('visibility.public')}
                  </Button>
                  <Button
                    type="button"
                    variant={visibility === 'private' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setVisibility('private')}
                  >
                    {t('visibility.private')}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('fields.description')}
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[90px]"
                placeholder={t('placeholders.aiGenerated')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('fields.tags')}
              </label>
              <Input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder={t('placeholders.aiGenerated')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('fields.avatar')}
              </label>
              <Input
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder={t('placeholders.avatar')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('fields.content')}
              </label>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[180px]"
                placeholder={t('placeholders.content')}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="rounded-full"
            disabled={saving || loadingDetail}
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
