'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import type { ComponentProps, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

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

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: 'user' | 'assistant'
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end justify-end gap-2 py-4',
      from === 'user' ? 'is-user' : 'is-assistant flex-row-reverse justify-end',
      '[&>div]:max-w-[80%]',
      className,
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & {
  markdown?: boolean
}

export const MessageContent = ({
  children,
  className,
  markdown = true,
  ...props
}: MessageContentProps) => {
  const shouldParse = markdown && typeof children === 'string'
  const parts = shouldParse ? parseContent(children) : null
  const hasImage = parts?.some((part) => part.type === 'image') ?? false

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg text-sm text-foreground px-4 py-3 overflow-hidden',
        'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
        'group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground',
        className,
      )}
      {...props}
    >
      {shouldParse ? (
        hasImage ? (
          <div className="flex flex-col gap-3">
            {parts?.map((part, index) => {
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
                <span key={`text-${index}`} className="whitespace-pre-wrap leading-relaxed">
                  {part.value}
                </span>
              )
            })}
          </div>
        ) : (
          <span className="whitespace-pre-wrap leading-relaxed">{children}</span>
        )
      ) : (
        children
      )}
    </div>
  )
}

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src?: string
  name?: string
}

export const MessageAvatar = ({ src, name, className, ...props }: MessageAvatarProps) => (
  <Avatar className={cn('size-8 ring ring-1 ring-border', className)} {...props}>
    {src && <AvatarImage alt="" className="mt-0 mb-0" src={src} />}
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
)
