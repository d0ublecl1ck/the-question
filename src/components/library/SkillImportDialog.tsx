import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppDispatch } from '@/store/hooks'
import { enqueueAlert } from '@/store/slices/alertSlice'
import { useImportSkillMutation } from '@/store/api/skillsApi'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('skillImport', {
  zh: {
    dialog: {
      title: '导入技能',
      description: '支持粘贴 SKILL.md 或 JSON 内容。',
    },
    fields: {
      name: '名称',
      visibility: '可见性',
      description: '描述',
      tags: '标签',
      content: 'SKILL.md / JSON 内容',
    },
    visibility: {
      public: '公开',
      private: '私有',
    },
    placeholders: {
      tags: '用逗号分隔',
      content: '粘贴 SKILL.md 或 JSON 内容',
    },
    actions: {
      submit: '确认导入',
      submitting: '导入中...',
    },
    toasts: {
      emptyFields: '名称与内容不能为空',
      success: '导入完成',
      failed: '导入失败，请稍后重试',
    },
  },
  en: {
    dialog: {
      title: 'Import skill',
      description: 'Paste SKILL.md or JSON content.',
    },
    fields: {
      name: 'Name',
      visibility: 'Visibility',
      description: 'Description',
      tags: 'Tags',
      content: 'SKILL.md / JSON content',
    },
    visibility: {
      public: 'Public',
      private: 'Private',
    },
    placeholders: {
      tags: 'Separate with commas',
      content: 'Paste SKILL.md or JSON content',
    },
    actions: {
      submit: 'Import',
      submitting: 'Importing...',
    },
    toasts: {
      emptyFields: 'Name and content are required.',
      success: 'Import completed.',
      failed: 'Import failed. Please try again.',
    },
  },
})

type SkillImportDialogProps = {
  triggerLabel: string
  onCompleted?: () => void
}

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

export default function SkillImportDialog({ triggerLabel, onCompleted }: SkillImportDialogProps) {
  const { t } = useTranslation('skillImport')
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [content, setContent] = useState('')
  const [importSkill] = useImportSkillMutation()
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription('')
    setTagsInput('')
    setVisibility('public')
    setContent('')
  }

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      dispatch(enqueueAlert({ description: t('toasts.emptyFields'), variant: 'destructive' }))
      return
    }
    setSaving(true)
    try {
      await importSkill({
        name: name.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput),
        visibility,
        content: content.trim(),
        versions: [],
      }).unwrap()
      dispatch(enqueueAlert({ description: t('toasts.success') }))
      setOpen(false)
      resetForm()
      onCompleted?.()
    } catch {
      dispatch(enqueueAlert({ description: t('toasts.failed'), variant: 'destructive' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>
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
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t('fields.tags')}
            </label>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder={t('placeholders.tags')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t('fields.content')}
            </label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[220px]"
              placeholder={t('placeholders.content')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="rounded-full" disabled={saving}>
            {saving ? t('actions.submitting') : t('actions.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
