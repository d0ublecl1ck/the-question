import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SkillItem } from '@/store/api/types'

type SkillSuggestionCardProps = {
  skill: SkillItem | null
  reason?: string | null
  onUse: () => void
  onDismiss: () => void
  onReject: () => void
  disabled?: boolean
}

const SkillSuggestionCard = ({
  skill,
  reason,
  onUse,
  onDismiss,
  onReject,
  disabled = false,
}: SkillSuggestionCardProps) => {
  if (!skill) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white/70 p-3 text-sm text-muted-foreground">
        检测到可用技能，但详情暂未加载。
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">推荐技能</p>
          <h3 className="text-base font-semibold text-foreground">使用技能「{skill.name}」？</h3>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{skill.description}</p>
      {reason && <p className="mt-2 text-xs text-muted-foreground">推荐理由：{reason}</p>}
      {skill.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onUse} disabled={disabled}>
          使用技能
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

export default SkillSuggestionCard
