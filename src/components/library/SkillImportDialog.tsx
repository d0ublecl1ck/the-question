import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppDispatch } from '@/store/hooks'
import { enqueueAlert } from '@/store/slices/alertSlice'
import { useImportSkillMutation } from '@/store/api/skillsApi'

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
      dispatch(enqueueAlert({ description: '名称与内容不能为空', variant: 'destructive' }))
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
      dispatch(enqueueAlert({ description: '导入完成' }))
      setOpen(false)
      resetForm()
      onCompleted?.()
    } catch {
      dispatch(enqueueAlert({ description: '导入失败，请稍后重试', variant: 'destructive' }))
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
          <DialogTitle>导入技能</DialogTitle>
          <DialogDescription>支持粘贴 SKILL.md 或 JSON 内容。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">名称</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">可见性</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={visibility === 'public' ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setVisibility('public')}
                >
                  公开
                </Button>
                <Button
                  type="button"
                  variant={visibility === 'private' ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setVisibility('private')}
                >
                  私有
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">描述</label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">标签</label>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="用逗号分隔"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              SKILL.md / JSON 内容
            </label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[220px]"
              placeholder="粘贴 SKILL.md 或 JSON 内容"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="rounded-full" disabled={saving}>
            {saving ? '导入中...' : '确认导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
