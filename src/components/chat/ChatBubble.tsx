import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components, UrlTransform } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

type ChatBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  skillName?: string
  messageId?: string
  onClarifyComplete?: (payload: {
    messageId?: string
    responses: ClarifyChainResponse
  }) => void
}
const CLARIFICATION_MARKER_REGEX = /<\!-{1,2}\s*Clarification chain\s*-{1,2}>/i

type UIElement = {
  key: string
  type: string
  props?: Record<string, unknown>
  children?: string[]
}

type UITree = {
  root: string
  elements: Record<string, UIElement>
}

type ClarifyChainItem = {
  type: 'single_choice' | 'ranking' | 'free_text'
  question: string
  choices?: string[]
  options?: string[]
}

type ClarifyChainPayload = {
  clarify_chain: ClarifyChainItem[]
}

type ClarifyChainResponse = {
  single_choice: { question: string; answer: string | null }[]
  ranking: { question: string; order: string[] }[]
  free_text: { question: string; answer: string }[]
}

const RELATIVE_URL_REGEX = /^(\/|\.\/|\.\.\/)/i
const SAFE_URL_REGEX = /^(https?:|mailto:|tel:)/i

const transformMarkdownUrl: UrlTransform = (url, key) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('#')) return trimmed
  if (RELATIVE_URL_REGEX.test(trimmed)) return trimmed
  if (SAFE_URL_REGEX.test(trimmed)) return trimmed
  if (key === 'src' && trimmed.startsWith('data:image/')) return trimmed
  return ''
}

const createMarkdownComponents = (role: ChatBubbleProps['role']): Components => {
  const isAssistant = role === 'assistant'
  const linkClassName = isAssistant
    ? 'text-sky-600 hover:text-sky-700'
    : 'text-background/90 hover:text-background'
  const inlineCodeClassName = isAssistant ? 'bg-foreground/10 text-foreground' : 'bg-white/15 text-white'
  const blockCodeClassName = isAssistant ? 'bg-foreground/5 text-foreground' : 'bg-white/10 text-white'
  const blockquoteClassName = isAssistant
    ? 'border-foreground/20 text-foreground/80'
    : 'border-white/30 text-white/80'
  const borderClassName = isAssistant ? 'border-border/70' : 'border-white/20'

  return {
    p: ({ children }) => (
      <p className="mt-2 whitespace-pre-wrap leading-relaxed first:mt-0">{children}</p>
    ),
    a: ({ href, children }) =>
      href ? (
        <a
          href={href}
          className={cn('underline underline-offset-2', linkClassName)}
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      ) : (
        <span className={cn('underline underline-offset-2', linkClassName)}>{children}</span>
      ),
    img: ({ src, alt }) =>
      src ? (
        <img
          src={src}
          alt={alt ?? ''}
          loading="lazy"
          className="my-2 block w-full max-w-full rounded-xl object-contain"
        />
      ) : null,
    code: ({ className, children, ...props }) =>
      !className ? (
        <code
          className={cn('rounded px-1.5 py-0.5 font-mono text-[0.85em]', inlineCodeClassName)}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code className={cn('font-mono text-[0.85rem]', className)} {...props}>
          {children}
        </code>
      ),
    pre: ({ children }) => (
      <pre
        className={cn(
          'mt-3 overflow-x-auto rounded-lg px-3 py-2 text-[0.85rem] leading-relaxed',
          blockCodeClassName,
        )}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className={cn('mt-3 border-l-2 pl-3 italic', blockquoteClassName)}>
        {children}
      </blockquote>
    ),
    ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    h1: ({ children }) => <h1 className="mt-3 text-base font-semibold leading-tight">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-3 text-sm font-semibold leading-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-2 text-sm font-semibold leading-tight">{children}</h3>,
    hr: () => <hr className={cn('my-3 border-0 border-t', borderClassName)} />,
    table: ({ children }) => (
      <div className="mt-3 overflow-x-auto">
        <table className={cn('w-full border-collapse text-sm', borderClassName)}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className={cn('border px-2 py-1 text-left font-semibold', borderClassName)}>
        {children}
      </th>
    ),
    td: ({ children }) => <td className={cn('border px-2 py-1 align-top', borderClassName)}>{children}</td>,
  }
}

export const buildClarifyResponsePayload = (
  clarificationTree: UITree | null,
  selectedChoices: Record<string, string | null>,
  rankingOrders: Record<string, string[]>,
  freeTexts: Record<string, string>,
): ClarifyChainResponse => {
  const response: ClarifyChainResponse = { single_choice: [], ranking: [], free_text: [] }
  if (!clarificationTree) return response
  const root = clarificationTree.elements[clarificationTree.root]
  const orderedKeys = root?.children ?? Object.keys(clarificationTree.elements)
  orderedKeys.forEach((key) => {
    const element = clarificationTree.elements[key]
    if (!element) return
    const props = element.props as { question?: string; choices?: string[] } | undefined
    const question = props?.question ?? ''
    if (element.type === 'single_choice') {
      response.single_choice.push({ question, answer: selectedChoices[key] ?? null })
    }
    if (element.type === 'ranking') {
      const order = rankingOrders[key] ?? props?.choices ?? []
      response.ranking.push({ question, order })
    }
    if (element.type === 'free_text') {
      response.free_text.push({ question, answer: freeTexts[key] ?? '' })
    }
  })
  return response
}

const stripCodeFence = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed.startsWith('```')) return trimmed
  const lines = trimmed.split('\n')
  if (lines.length <= 2) return ''
  const fence = lines[0].trim()
  if (!fence.startsWith('```')) return trimmed
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '```')
  const contentLines = endIndex === -1 ? lines.slice(1) : lines.slice(1, endIndex)
  return contentLines.join('\n').trim()
}

const extractJsonBlock = (value: string): string | null => {
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return value.slice(start, end + 1)
}

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')

const isValidTree = (value: unknown): value is UITree => {
  if (!value || typeof value !== 'object') return false
  const tree = value as UITree
  return typeof tree.root === 'string' && tree.root.length > 0 && typeof tree.elements === 'object' && !!tree.elements
}

const isClarifyChainPayload = (value: unknown): value is ClarifyChainPayload => {
  if (!value || typeof value !== 'object') return false
  const payload = value as ClarifyChainPayload
  return Array.isArray(payload.clarify_chain)
}

const buildTreeFromClarifyChain = (payload: ClarifyChainPayload): UITree => {
  const rootKey = 'clarify-chain'
  const elements: Record<string, UIElement> = {
    [rootKey]: {
      key: rootKey,
      type: 'ClarifyChain',
      children: payload.clarify_chain.map((_, index) => `clarify-${index}`),
    },
  }

  payload.clarify_chain.forEach((item, index) => {
    elements[`clarify-${index}`] = {
      key: `clarify-${index}`,
      type: item.type,
      props: {
        question: item.question,
        choices: item.choices ?? item.options ?? [],
      },
    }
  })

  return { root: rootKey, elements }
}

const parseClarificationChain = (value: string): UITree | null => {
  const normalized = decodeHtmlEntities(value.replace(/^\uFEFF/, ''))
  const unescaped = normalized
  const markerMatch = unescaped.match(CLARIFICATION_MARKER_REGEX)
  const contentAfterMarker = markerMatch
    ? unescaped.slice(unescaped.indexOf(markerMatch[0]) + markerMatch[0].length).trimStart()
    : unescaped
  if (!contentAfterMarker) return null

  const jsonText = stripCodeFence(contentAfterMarker)
  const payloadText = extractJsonBlock(jsonText) ?? jsonText
  const fallbackText = extractJsonBlock(unescaped)
  const markerlessText = extractJsonBlock(stripCodeFence(unescaped)) ?? stripCodeFence(unescaped)
  const candidates = [payloadText, fallbackText].filter(Boolean) as string[]
  const expandedCandidates = [...candidates, markerlessText].filter(Boolean) as string[]
  for (const candidate of expandedCandidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (isValidTree(parsed)) return parsed
      if (isClarifyChainPayload(parsed)) return buildTreeFromClarifyChain(parsed)
    } catch {
      continue
    }
  }
  return null
}

const renderSingleChoice = (
  element: UIElement,
  selected: string | null,
  onSelect: (value: string) => void
) => {
  const props = element.props as { question?: string; choices?: string[] } | undefined
  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-3">
      <p className="text-sm font-medium text-foreground">{props?.question}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(props?.choices ?? []).map((choice) => {
          const isActive = selected === choice
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onSelect(choice)}
              className={[
                'rounded-full border px-2.5 py-1 text-xs transition',
                isActive
                  ? 'border-foreground/70 bg-foreground text-background'
                  : 'border-border/60 text-foreground/80 hover:border-foreground/40',
              ].join(' ')}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const renderRanking = (
  element: UIElement,
  order: string[],
  onReorder: (next: string[]) => void,
  dragState: { key: string; index: number } | null,
  onDragStart: (key: string, index: number) => void,
  onDragEnd: () => void
) => {
  const props = element.props as { question?: string; choices?: string[] } | undefined
  const items = order.length ? order : props?.choices ?? []

  const moveItem = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onReorder(next)
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    moveItem(index, nextIndex)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-3">
      <p className="text-sm font-medium text-foreground">{props?.question}</p>
      <ol className="mt-2 space-y-2 text-sm text-foreground/80">
        {items.map((option, index) => (
          <li
            key={option}
            draggable
            onDragStart={() => onDragStart(element.key, index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragState || dragState.key !== element.key) return
              moveItem(dragState.index, index)
              onDragEnd()
            }}
            onDragEnd={() => onDragEnd()}
            className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-white/60 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{index + 1}</span>
            <span className="flex-1">{option}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-foreground/40"
                onClick={() => handleMove(index, -1)}
                aria-label="上移"
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-foreground/40"
                onClick={() => handleMove(index, 1)}
                aria-label="下移"
              >
                ↓
              </button>
              <span className="cursor-grab text-xs text-muted-foreground">⇅</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const renderFreeText = (
  element: UIElement,
  value: string,
  onChange: (next: string) => void
) => {
  const props = element.props as { question?: string } | undefined
  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-3">
      <p className="text-sm font-medium text-foreground">{props?.question}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="在这里补充你的答案…"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-dashed border-border/60 bg-white/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40"
      />
    </div>
  )
}

const renderTree = (
  tree: UITree,
  selections: Record<string, string | null>,
  onSelect: (key: string, value: string) => void,
  rankings: Record<string, string[]>,
  onReorder: (key: string, next: string[]) => void,
  dragState: { key: string; index: number } | null,
  onDragStart: (key: string, index: number) => void,
  onDragEnd: () => void,
  freeTexts: Record<string, string>,
  onFreeTextChange: (key: string, next: string) => void
): ReactNode => {
  const visited = new Set<string>()

  const renderElement = (key: string): ReactNode => {
    if (visited.has(key)) return null
    visited.add(key)
    const element = tree.elements[key]
    if (!element) return null

    if (element.type === 'ClarifyChain') {
      const children = (element.children ?? []).map((childKey) => (
        <div key={childKey}>{renderElement(childKey)}</div>
      ))
      return <div className="flex flex-col gap-3">{children}</div>
    }
    if (element.type === 'single_choice')
      return renderSingleChoice(element, selections[key] ?? null, (value) => onSelect(key, value))
    if (element.type === 'ranking')
      return renderRanking(
        element,
        rankings[key] ?? [],
        (next) => onReorder(key, next),
        dragState,
        onDragStart,
        onDragEnd,
      )
    if (element.type === 'free_text')
      return renderFreeText(element, freeTexts[key] ?? '', (next) => onFreeTextChange(key, next))
    return null
  }

  return renderElement(tree.root)
}

export default function ChatBubble({
  role,
  content,
  skillName,
  messageId,
  onClarifyComplete,
}: ChatBubbleProps) {
  const bubbleClassName =
    role === 'assistant'
      ? 'inline-flex w-fit max-w-[78%] self-start flex-col rounded-2xl border border-border/60 bg-white/80 p-4 text-foreground'
      : 'inline-flex w-fit max-w-[78%] self-end flex-col rounded-2xl border border-foreground/10 bg-foreground p-4 text-background'
  const badgeVariant = role === 'assistant' ? 'secondary' : 'outline'
  const badgeClassName = role === 'assistant' ? '' : 'border-white/40 text-white'
  const clarificationTree = useMemo(
    () => (role === 'assistant' ? parseClarificationChain(content) : null),
    [content, role],
  )
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string | null>>({})
  const [rankingOrders, setRankingOrders] = useState<Record<string, string[]>>({})
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({})
  const [dragState, setDragState] = useState<{ key: string; index: number } | null>(null)
  const [isDone, setIsDone] = useState(false)
  const markdownComponents = useMemo(() => createMarkdownComponents(role), [role])

  useEffect(() => {
    if (!clarificationTree) {
      setSelectedChoices({})
      setRankingOrders({})
      setFreeTexts({})
      setIsDone(false)
      setDragState(null)
      return
    }
    const nextChoices: Record<string, string | null> = {}
    const nextRankings: Record<string, string[]> = {}
    const nextFreeTexts: Record<string, string> = {}
    Object.values(clarificationTree.elements).forEach((element) => {
      if (element.type === 'single_choice') {
        nextChoices[element.key] = null
      }
      if (element.type === 'ranking') {
        const props = element.props as { choices?: string[] } | undefined
        nextRankings[element.key] = [...(props?.choices ?? [])]
      }
      if (element.type === 'free_text') {
        nextFreeTexts[element.key] = ''
      }
    })
    setSelectedChoices(nextChoices)
    setRankingOrders(nextRankings)
    setFreeTexts(nextFreeTexts)
    setIsDone(false)
    setDragState(null)
  }, [clarificationTree])

  return (
    <div className={bubbleClassName}>
      {clarificationTree ? (
        <div className="flex flex-col gap-3">
          {renderTree(
            clarificationTree,
            selectedChoices,
            (key, value) => {
              setSelectedChoices((prev) => ({ ...prev, [key]: value }))
              setIsDone(false)
            },
            rankingOrders,
            (key, next) => {
              setRankingOrders((prev) => ({ ...prev, [key]: next }))
              setIsDone(false)
            },
            dragState,
            (key, index) => setDragState({ key, index }),
            () => setDragState(null),
            freeTexts,
            (key, next) => {
              setFreeTexts((prev) => ({ ...prev, [key]: next }))
              setIsDone(false)
            }
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant={isDone ? 'default' : 'outline'}
              className="gap-2"
              onClick={() => {
                const nextDone = !isDone
                setIsDone(nextDone)
                if (nextDone && onClarifyComplete) {
                  onClarifyComplete({
                    messageId,
                    responses: buildClarifyResponsePayload(
                      clarificationTree,
                      selectedChoices,
                      rankingOrders,
                      freeTexts,
                    ),
                  })
                }
              }}
            >
              <Check className="h-4 w-4" />
              {isDone ? '已完成' : '完成'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={markdownComponents}
            urlTransform={transformMarkdownUrl}
          >
            {content}
          </ReactMarkdown>
        </div>
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
