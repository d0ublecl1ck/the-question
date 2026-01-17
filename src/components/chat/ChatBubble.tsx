import { Badge } from '@/components/ui/badge'

type ChatBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  skillName?: string
}

type ContentPart =
  | { type: 'text'; value: string }
  | { type: 'image'; src: string; alt: string }

const IMAGE_MARKDOWN = /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[^)]+)\)/g

const parseContent = (content: string): ContentPart[] => {
  const parts: ContentPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  IMAGE_MARKDOWN.lastIndex = 0
  while ((match = IMAGE_MARKDOWN.exec(content)) !== null) {
    const [full, altText, src] = match
    const start = match.index
    if (start > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, start) })
    }
    parts.push({ type: 'image', src, alt: altText || 'image' })
    lastIndex = start + full.length
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', value: content })
  }
  return parts
}

export default function ChatBubble({ role, content, skillName }: ChatBubbleProps) {
  const bubbleClassName =
    role === 'assistant'
      ? 'inline-flex w-fit max-w-[78%] self-start flex-col rounded-2xl border border-border/60 bg-white/80 p-4 text-foreground'
      : 'inline-flex w-fit max-w-[78%] self-end flex-col rounded-2xl border border-foreground/10 bg-foreground p-4 text-background'
  const badgeVariant = role === 'assistant' ? 'secondary' : 'outline'
  const badgeClassName = role === 'assistant' ? '' : 'border-white/40 text-white'
  const parts = parseContent(content)
  const hasImage = parts.some((part) => part.type === 'image')

  return (
    <div className={bubbleClassName}>
      {hasImage ? (
        <div className="flex flex-col gap-3">
          {parts.map((part, index) => {
            if (part.type === 'image') {
              return (
                <img
                  key={`img-${index}-${part.src.length}`}
                  src={part.src}
                  alt={part.alt}
                  className="w-full max-w-full rounded-xl object-contain"
                />
              )
            }
            if (!part.value) return null
            return (
              <span key={`text-${index}`} className="whitespace-pre-wrap text-sm leading-relaxed">
                {part.value}
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
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
