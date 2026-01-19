import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('skillDraftSuggestion', {
  zh: {
    label: '沉淀技能',
    title: '把这段流程沉淀成技能？',
    goalLabel: '目标：',
    constraintsLabel: '约束：',
    reason: '推荐理由：{{reason}}',
    badge: '技能沉淀',
    actions: {
      accept: '生成并保存',
      later: '先不',
      dismiss: '不再提示',
    },
  },
  en: {
    label: 'Capture skill',
    title: 'Turn this flow into a skill?',
    goalLabel: 'Goal:',
    constraintsLabel: 'Constraints:',
    reason: 'Reason: {{reason}}',
    badge: 'Skill capture',
    actions: {
      accept: 'Generate & save',
      later: 'Not now',
      dismiss: 'Don’t show again',
    },
  },
})

type SkillDraftSuggestionCardProps = {
  goal: string
  constraints?: string | null
  reason?: string | null
  onAccept: () => void
  onDismiss: () => void
  onReject: () => void
  disabled?: boolean
}

const SkillDraftSuggestionCard = ({
  goal,
  constraints,
  reason,
  onAccept,
  onDismiss,
  onReject,
  disabled = false,
}: SkillDraftSuggestionCardProps) => {
  const { t } = useTranslation('skillDraftSuggestion')
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{t('label')}</p>
          <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
        </div>
      </div>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground/90">{t('goalLabel')}</span>
          {goal}
        </p>
        {constraints && (
          <p>
            <span className="font-medium text-foreground/90">{t('constraintsLabel')}</span>
            {constraints}
          </p>
        )}
        {reason && <p className="text-xs text-muted-foreground">{t('reason', { reason })}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">{t('badge')}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept} disabled={disabled}>
          {t('actions.accept')}
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} disabled={disabled}>
          {t('actions.later')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject} disabled={disabled}>
          {t('actions.dismiss')}
        </Button>
      </div>
    </div>
  )
}

export default SkillDraftSuggestionCard
