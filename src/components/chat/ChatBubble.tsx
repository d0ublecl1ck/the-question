import { Badge } from '@/components/ui/badge'

type ChatBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  skillName?: string
}

export default function ChatBubble({ role, content, skillName }: ChatBubbleProps) {
  const bubbleClassName =
    role === 'assistant'
      ? 'max-w-[78%] rounded-2xl border border-border/60 bg-white/80 p-4 text-foreground'
      : 'ml-auto max-w-[78%] rounded-2xl border border-foreground/10 bg-foreground p-4 text-background'
  const badgeVariant = role === 'assistant' ? 'secondary' : 'outline'
  const badgeClassName = role === 'assistant' ? '' : 'border-white/40 text-white'

  return (
    <div className={bubbleClassName}>
      <p className="text-sm leading-relaxed">{content}</p>
      {skillName && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={badgeVariant} className={badgeClassName}>
            {skillName}
          </Badge>
        </div>
      )}
    </div>
  )
}
