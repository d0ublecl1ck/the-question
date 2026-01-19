'use client'

import { Button } from '@/components/ui/button'
import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useCallback, useEffect } from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { cn } from '@/lib/utils'

export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-auto', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
)

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn('p-4', className)} {...props} />
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  return (
    !isAtBottom && (
      <Button
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-sm',
          className,
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}

export type ConversationScrollStateProps = {
  onAtBottomChange?: (isAtBottom: boolean) => void
}

export const ConversationScrollState = ({ onAtBottomChange }: ConversationScrollStateProps) => {
  const { isAtBottom } = useStickToBottomContext()

  useEffect(() => {
    onAtBottomChange?.(isAtBottom)
  }, [isAtBottom, onAtBottomChange])

  return null
}
