import { ArrowRight, Bot, Check, ChevronDown, Paperclip } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('aiPrompt', {
  zh: {
    placeholder: '输入内容，回车发送',
    model: {
      placeholder: '选择模型',
    },
    aria: {
      attachFile: '添加附件',
      selectSkill: '选择技能',
      send: '发送消息',
    },
  },
  en: {
    placeholder: 'Type a message, press Enter to send',
    model: {
      placeholder: 'Select model',
    },
    aria: {
      attachFile: 'Attach file',
      selectSkill: 'Select skill',
      send: 'Send message',
    },
  },
})

export type AiModelOption = {
  id: string
  name: string
  host: string
}

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`

      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      )

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const OPENAI_ICON = (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 260"
      aria-label="OpenAI Icon"
      className="block h-4 w-4 dark:hidden"
    >
      <title>OpenAI Icon Light</title>
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 260"
      aria-label="OpenAI Icon"
      className="hidden h-4 w-4 dark:block"
    >
      <title>OpenAI Icon Dark</title>
      <path
        fill="#fff"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
      />
    </svg>
  </>
)

const MINIMAX_ICON = (
  <svg
    className="h-4 w-4"
    viewBox="0 0 1170 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="MiniMax Icon"
    role="img"
  >
    <title>MiniMax Icon</title>
    <path
      d="M474.182045 470.672834v376.72835c-25.441775 127.574417-194.688064 94.67557-195.41915 2.193256-0.804194-116.242592 0-231.754098 0-347.119387v-133.788644c0-16.741858-3.655427-29.974505-18.277137-40.429027-28.512334-21.347696-62.727134 3.728536-63.45822 34.507235-1.608388 41.30633-0.804194 81.735357-1.608388 122.456818 0 32.167761 0 63.385111 0.731085 95.479765C175.168082 722.020023 3.947862 698.552179 0 581.505394v-97.965455c0-32.021544 62.727134-39.551725 59.656575 8.407483-2.047039 23.760278-0.731085 48.251642-1.535279 71.792594-0.731085 42.037415 63.531329 70.330424 78.664798 1.608388 0.731085-56.659125 0.731085-113.31825 0.731085-170.489134 0-71.646377 20.324176-129.986999 96.283959-135.397032 32.898847-2.924342 54.758303 10.820065 75.740456 34.580343 8.04194 8.407483 27.050163 35.092103 27.781248 64.116197 0 26.757729 0.731085 53.36924 0.731086 80.419404 0 53.36924-0.731085 107.030915-0.731086 160.400155 0 34.580343 0.731085 68.795144 0.731086 102.571293 0 42.841609 0 86.268087-0.731086 129.182805-0.731085 55.781822 67.113647 54.977628 78.006821-0.877303 0-65.797694 0.731085-130.791193 0.731086-196.588886 0-162.081652-0.731085-324.163303-0.731086-486.171847 0-16.814966-2.339474-63.45822 6.57977-80.419403 47.374339-115.438398 191.105745-65.066608 192.421699 30.486265 2.778125 195.784692 0 393.762641 0.731085 589.985985 0 68.064059-55.270063 53.442349-58.340621 26.830837 0-204.192176 0-409.188545 0.731085-613.088286C554.747665 49.713813 478.860992 56.659125 474.474479 93.359616c-1.462171 42.110524-0.731085 84.952133-1.462171 126.989549v250.031235h0.731085l0.51176 0.292434z"
      fill="#D4367A"
    />
    <path
      d="M696.358923 467.675384v276.642747-652.859337c24.710689-128.451719 193.88387-95.041113 194.614956-2.485691 0.804194 115.438398 0 231.68099 0.804194 347.046279 0 44.30378 0 88.753778-0.731086 133.057558 0 17.546052 4.313404 29.901396 19.008223 41.160113 27.781248 20.835936 61.92294-3.655427 63.45822-34.945886 1.53528-40.502136 0.731085-81.004272 0.731085-122.529927V357.866344c21.201479-141.318824 191.909939-117.85098 195.492259-0.804194v354.57646c0 32.167761-61.996049 39.77105-59.217925-8.334375 1.681497-24.491364 0-304.935755 0.877303-329.500227 1.462171-41.30633-63.604437-70.403532-78.664798-0.877303v169.611832c0 72.669897-20.397285 130.060108-97.015044 136.274334-72.231246 1.681497-101.255339-48.251642-103.594813-98.69654v-342.879092c0-43.645803 0-86.268087 0.731086-129.109696 0.731085-55.781822-67.113647-55.781822-78.664798 0.804194V876.571495c0 16.668749 2.339474 63.385111-5.921793 80.419403-47.301231 115.365289-191.763722 64.920391-193.079676-30.559373v-90.873926c3.582319-61.191855 55.270063-46.643254 57.609536-20.762828v107.835109c2.778125 51.322201 78.664798 45.107974 82.247117 7.603289 1.53528-42.110524 1.53528-84.147939 1.53528-127.062657V467.748492h-0.219326v-0.073108z"
      fill="#ED6D48"
    />
  </svg>
)

const MODEL_HOST_ICONS: Record<string, React.ReactNode> = {
  openai: OPENAI_ICON,
  minimax: MINIMAX_ICON,
}

const MODEL_ID_ICONS: Record<string, React.ReactNode> = {
  'gpt-5.2-2025-12-11': OPENAI_ICON,
  'MiniMax-M2.1-lightning': MINIMAX_ICON,
}

const getModelIcon = (model: AiModelOption | null | undefined) => {
  const normalizedHost = model?.host?.toLowerCase() ?? ''
  return MODEL_HOST_ICONS[normalizedHost] ?? MODEL_ID_ICONS[model?.id ?? ''] ?? null
}

type AiPromptProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onTriggerSkill?: () => void
  models: AiModelOption[]
  selectedModelId: string | null
  onModelChange: (modelId: string) => void
  disabled?: boolean
  surface?: 'default' | 'flat'
  collapsed?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

export function AI_Prompt({
  value,
  onChange,
  onSend,
  onTriggerSkill,
  models,
  selectedModelId,
  onModelChange,
  disabled,
  surface = 'default',
  collapsed,
  onFocus,
  onBlur,
}: AiPromptProps) {
  const { t } = useTranslation('aiPrompt')
  const safeModels = Array.isArray(models) ? models : []
  const isCollapsed = Boolean(collapsed && value.trim().length === 0)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: isCollapsed ? 40 : 72,
    maxHeight: isCollapsed ? 40 : 300,
  })
  const surfaceClassName = surface === 'flat' ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5'
  const textareaMinHeightClass = isCollapsed ? 'min-h-[40px]' : 'min-h-[72px]'
  const containerPaddingClass = isCollapsed ? 'py-2' : 'py-4'
  const toolbarHeightClass = isCollapsed ? 'h-12' : 'h-14'

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null
    return safeModels.find((model) => model.id === selectedModelId) ?? null
  }, [safeModels, selectedModelId])

  useEffect(() => {
    if (isCollapsed) {
      adjustHeight(true)
      return
    }
    adjustHeight()
  }, [adjustHeight, isCollapsed, value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && value.trim()) {
      event.preventDefault()
      onSend()
      adjustHeight(true)
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className={cn('w-full transition-all duration-200 ease-out', containerPaddingClass)}>
      <div className={cn('rounded-lg p-1.5 transition-shadow duration-200 ease-out', surfaceClassName)}>
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
              <Textarea
                id="ai-input-15"
                value={value}
                placeholder={t('placeholder')}
                className={cn(
                  'w-full resize-none rounded-lg rounded-b-none border-none px-4 py-3 placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white dark:placeholder:text-white/70',
                  'transition-[height] duration-200 ease-out will-change-[height]',
                  surface === 'flat' ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5',
                  textareaMinHeightClass,
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                  onChange(event.target.value)
                  adjustHeight()
                }}
                onFocus={() => onFocus?.()}
                onBlur={() => onBlur?.()}
                rows={isCollapsed ? 1 : undefined}
              />
            </div>

            <div
              className={cn(
                'flex items-center rounded-b-lg transition-[height] duration-200 ease-out',
                surfaceClassName,
                toolbarHeightClass,
              )}
            >
              <div className="absolute bottom-3 left-3 right-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 gap-1 rounded-lg pl-1 pr-2 text-xs hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:text-white dark:hover:bg-white/10"
                        disabled={models.length === 0}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedModel?.id ?? 'default-model'}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            {getModelIcon(selectedModel) ?? <Bot className="h-4 w-4 opacity-50" />}
                            <span>{selectedModel?.name ?? t('model.placeholder')}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        'min-w-[10rem]',
                        'border-black/10 dark:border-white/10',
                        'bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800',
                      )}
                    >
                      {safeModels.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onSelect={() => onModelChange(model.id)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {getModelIcon(model) ?? <Bot className="h-4 w-4 opacity-50" />}
                            <span>{model.name}</span>
                          </div>
                          {selectedModel?.id === model.id && <Check className="h-4 w-4 text-blue-500" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />
                  <label
                    className={cn(
                      'cursor-pointer flex h-9 w-9 items-center justify-center rounded-[8px] bg-black/5',
                      'text-black/40 hover:bg-black/10 hover:text-black focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
                      'dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white',
                    )}
                    aria-label={t('aria.attachFile')}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          const result = typeof reader.result === 'string' ? reader.result : ''
                          if (!result) return
                          const nextValue = `${value}${value ? '\n' : ''}![image](${result})\n`
                          onChange(nextValue)
                          adjustHeight()
                        }
                        reader.readAsDataURL(file)
                        event.target.value = ''
                      }}
                    />
                    <Paperclip className="h-4 w-4 transition-colors" />
                  </label>
                  <button
                    type="button"
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-[8px] bg-black/5',
                      'text-black/40 hover:bg-black/10 hover:text-black focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                      'dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white',
                    )}
                    aria-label={t('aria.selectSkill')}
                    disabled={!onTriggerSkill}
                    onClick={() => onTriggerSkill?.()}
                  >
                    <svg
                      className="h-4 w-4 transition-colors"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="3369"
                    >
                      <path
                        d="M476.736 51.2a152 152 0 0 1 137.408 133.952l0.832 13.184h107.392c23.68 0 46.592 7.296 65.728 20.672l7.936 6.08 7.488 6.784c18.816 18.816 30.4 43.392 33.024 69.632l0.576 11.264-0.064 107.008 9.6 0.512a152.128 152.128 0 0 1 93.952 43.328l8.192 8.768 6.912 8.64a151.232 151.232 0 0 1 0 180.48c-24.128 32.448-59.456 53.12-97.536 59.264l-11.52 1.472-9.6 0.448v106.88c0.128 23.68-7.168 46.592-20.48 65.728l-6.144 7.936-6.848 7.488c-18.816 18.816-43.52 30.4-69.824 33.024l-11.392 0.576H555.904a32 32 0 0 1-30.144-42.752l4.096-11.52a70.144 70.144 0 0 0-24.448-79.872 70.528 70.528 0 0 0-83.84 0 70.144 70.144 0 0 0-26.752 71.872l2.304 8.064 4.096 11.52a32 32 0 0 1-30.08 42.688H204.288a114.88 114.88 0 0 1-114.24-103.36l-0.512-11.264v-165.568a32 32 0 0 1 42.56-30.208l11.648 4.096c29.056 10.176 61.376 0.192 79.616-24.512a69.824 69.824 0 0 0 0-83.136c-16.64-22.4-44.8-32.64-71.616-26.752l-8 2.304-11.648 4.032a32 32 0 0 1-42.56-30.208V313.6a114.56 114.56 0 0 1 105.344-114.048l9.408-0.384H311.68l0.704-11.648a151.04 151.04 0 0 1 14.528-50.816l6.4-11.84 6.208-9.408a151.68 151.68 0 0 1 62.336-50.88L412.608 60.16l3.2-1.024c10.752-3.2 19.968-5.312 27.712-6.4C451.2 51.712 462.336 51.2 476.736 51.2z m-1.6 96.64l-4.352-0.64-12.032 0.512a36.608 36.608 0 0 0-2.048 0.192l-7.04 1.472-4.992 1.344a58.496 58.496 0 0 0-21.504 13.44l-3.328 3.84-4.288 6.4a60.8 60.8 0 0 0-6.592 15.36l-0.768 3.968-4.672 71.424a32 32 0 0 1-31.936 29.888H204.352a18.688 18.688 0 0 0-18.24 14.272l-0.512 4.224V407.04l7.872 1.024c38.08 6.144 73.6 25.472 99.648 55.808l7.488 9.408a165.824 165.824 0 0 1-107.136 262.528l-7.872 1.024v93.056c0 3.2 0.832 6.336 2.432 9.088l2.944 3.84a18.816 18.816 0 0 0 9.6 5.12l3.776 0.384 93.76-0.064 1.024-7.68a166.144 166.144 0 0 1 55.936-100.096l9.536-7.552a166.528 166.528 0 0 1 263.232 107.712l0.96 7.616 93.568 0.064a26.24 26.24 0 0 0 9.28-1.92l1.152-0.512 4.032-4.288a18.176 18.176 0 0 0 3.776-7.616l0.512-4.352-0.064-167.808a32 32 0 0 1 30.4-32l67.008-3.2a55.936 55.936 0 0 0 40.192-22.4 55.616 55.616 0 0 0 5.824-57.216l-3.648-5.952-4.736-5.952a57.472 57.472 0 0 0-27.392-17.664l-7.04-1.28-70.272-3.648a32 32 0 0 1-30.336-32v-167.68a25.472 25.472 0 0 0-1.792-8.96l-0.512-1.088-4.288-4.032a18.816 18.816 0 0 0-7.68-3.84l-4.48-0.576H545.6a32 32 0 0 1-31.872-34.56l4.992-62.528-0.448-4.8a55.168 55.168 0 0 0-5.12-15.296l-4.224-7.04a55.936 55.936 0 0 0-33.792-22.208z"
                        fill="currentColor"
                        p-id="3370"
                      />
                    </svg>
                  </button>
                </div>
                  <button
                    type="button"
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-[8px] bg-black/5',
                      'hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:bg-white/5 dark:hover:bg-white/10',
                    )}
                    aria-label={t('aria.send')}
                    disabled={!canSend}
                    onClick={() => {
                      if (!canSend) return
                    onSend()
                    adjustHeight(true)
                  }}
                >
                  <ArrowRight
                    className={cn(
                      'h-4 w-4 transition-opacity duration-200 dark:text-white',
                      canSend ? 'opacity-100' : 'opacity-30',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
