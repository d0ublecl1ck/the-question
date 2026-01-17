import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">沉淀技能</p>
          <h3 className="text-base font-semibold text-foreground">把这段流程沉淀成技能？</h3>
        </div>
      </div>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground/90">目标：</span>
          {goal}
        </p>
        {constraints && (
          <p>
            <span className="font-medium text-foreground/90">约束：</span>
            {constraints}
          </p>
        )}
        {reason && <p className="text-xs text-muted-foreground">推荐理由：{reason}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">技能沉淀</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept} disabled={disabled}>
          生成并保存
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} disabled={disabled}>
          先不
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject} disabled={disabled}>
          不再提示
        </Button>
      </div>
    </div>
  )
}

export default SkillDraftSuggestionCard
