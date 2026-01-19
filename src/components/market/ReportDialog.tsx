import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateSkillReportMutation } from '@/store/api/marketApi'

type ReportDialogProps = {
  targetId: string
  targetName: string
}

export default function ReportDialog({ targetId, targetName }: ReportDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [createReport] = useCreateSkillReportMutation()

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && status !== 'loading'

  const submit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    try {
      await createReport({ targetId, title: title.trim(), content: content.trim() }).unwrap()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          举报
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>举报技能</DialogTitle>
          <DialogDescription>请描述 {targetName} 存在的问题。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="问题摘要" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea
            placeholder="详细描述"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[120px]"
          />
          {status === 'success' && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
              <AlertDescription>已提交举报</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive" className="shadow-none">
              <AlertDescription>提交失败，请稍后重试</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStatus('idle')}>
            取消
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {status === 'loading' ? '提交中...' : '提交举报'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
