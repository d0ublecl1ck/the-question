import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateSkillReportMutation } from '@/store/api/marketApi'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('reportDialog', {
  zh: {
    trigger: '举报',
    title: '举报技能',
    description: '请描述 {{name}} 存在的问题。',
    fields: {
      summary: '问题摘要',
      detail: '详细描述',
    },
    status: {
      success: '已提交举报',
      error: '提交失败，请稍后重试',
    },
    actions: {
      cancel: '取消',
      submit: '提交举报',
      submitting: '提交中...',
    },
  },
  en: {
    trigger: 'Report',
    title: 'Report skill',
    description: 'Describe the issue with {{name}}.',
    fields: {
      summary: 'Issue summary',
      detail: 'Details',
    },
    status: {
      success: 'Report submitted',
      error: 'Submission failed. Please try again.',
    },
    actions: {
      cancel: 'Cancel',
      submit: 'Submit report',
      submitting: 'Submitting...',
    },
  },
})

type ReportDialogProps = {
  targetId: string
  targetName: string
}

export default function ReportDialog({ targetId, targetName }: ReportDialogProps) {
  const { t } = useTranslation('reportDialog')
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
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: targetName })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t('fields.summary')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Textarea
            placeholder={t('fields.detail')}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[120px]"
          />
          {status === 'success' && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
              <AlertDescription>{t('status.success')}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive" className="shadow-none">
              <AlertDescription>{t('status.error')}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStatus('idle')}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {status === 'loading' ? t('actions.submitting') : t('actions.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
