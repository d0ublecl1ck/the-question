import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ChatComposer from '@/components/chat/ChatComposer'
import ChatBubble from '@/components/chat/ChatBubble'
import SkillSuggestionCard from '@/components/chat/SkillSuggestionCard'
import SkillDraftSuggestionCard from '@/components/chat/SkillDraftSuggestionCard'
import { Message } from '@/components/ui/message'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationScrollState,
} from '@/components/ui/conversation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { streamAiChat, watchAiChatStream } from '@/store/api/aiStream'
import {
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
  useLazyListChatMessagesQuery,
  useListChatMessagesQuery,
  useListChatSessionsQuery,
  useListSkillsQuery,
  useListSkillSuggestionsQuery,
  useListSkillDraftSuggestionsQuery,
  useUpdateSkillDraftSuggestionMutation,
  useAcceptSkillDraftSuggestionMutation,
  useUpdateChatSessionTitleMutation,
  useUpdateSkillSuggestionMutation,
} from '@/store/api/chatApi'
import { useListAiModelsQuery } from '@/store/api/aiApi'
import type { ChatMessage as ApiChatMessage, ChatSession, SkillSuggestion, SkillDraftSuggestion } from '@/store/api/types'
import { enqueueAlert } from '@/store/slices/alertSlice'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('chat', {
  zh: {
    session: {
      defaultTitle: '对话',
      new: '新建',
      history: '历史对话',
      searchPlaceholder: '搜索对话',
      emptyHistory: '暂无历史对话',
      untitled: '未命名对话',
      delete: '删除',
      rename: '重命名',
      panelTitle: '对话台',
      expandSidebar: '展开侧边栏',
      collapseSidebar: '收起侧边栏',
    },
    loginGate: {
      title: '对话',
      description: '请先登录以同步技能与对话。',
      action: '去登录',
    },
    guest: {
      hint: '以访客身份探索？登录以获取完整体验',
      action: '登录',
    },
    root: {
      watchaAria: '前往 watcha.cn',
      watchaText: '深蓝的天空中挂着一轮金黄的圆月......',
      title: '今天可以帮你做什么？',
      description: '选择技能与模型，快速进入对话并保持连续行动。',
    },
    emptyMessages: '还没有消息，开始你的第一条对话。',
    skillPicker: {
      title: '选择技能',
      description: '上下键选择，回车确认；支持关键词匹配。',
      placeholder: '搜索技能名称 / 标签 / 描述',
      empty: '没有找到匹配的技能',
      group: '技能列表',
    },
    deleteDialog: {
      title: '确认删除对话？',
      descriptionWithTitle: '“{{title}}”将被永久删除，无法恢复。',
      description: '该对话将被永久删除，无法恢复。',
      cancel: '取消',
      delete: '删除',
    },
    renameDialog: {
      title: '重命名对话',
      description: '为该对话设置一个新的名称。',
      placeholder: '请输入新的对话名称',
      cancel: '取消',
      save: '保存',
    },
    navigator: {
      ariaLabel: '消息导航',
      headerLabel: '消息',
      jumpLabel: '跳转到第 {{index}} 条消息（{{role}}）',
      fallbackGenerating: '正在生成…',
      fallbackEmpty: '空消息',
      roleShort: {
        user: 'Y',
        assistant: 'A',
      },
    },
    toasts: {
      skillNotLoaded: '技能未加载，请稍后重试',
      skillChosen: '已选择技能：{{name}}',
      skillSuggestionUpdateFailed: '更新技能建议失败',
      skillSuggestionClosed: '已关闭该技能推荐',
      modelUnavailable: '模型不可用，请稍后重试',
      draftAccepted: '已生成技能：{{name}}',
      draftFailed: '生成技能失败',
      draftClosed: '已关闭沉淀建议',
      draftUpdateFailed: '更新沉淀建议失败',
      renameEmpty: '请输入新的对话名称',
      renameFailed: '重命名失败',
      messageNotFound: '未找到对应消息',
    },
  },
  en: {
    session: {
      defaultTitle: 'Chat',
      new: 'New',
      history: 'History',
      searchPlaceholder: 'Search chats',
      emptyHistory: 'No chats yet',
      untitled: 'Untitled chat',
      delete: 'Delete',
      rename: 'Rename',
      panelTitle: 'Chat desk',
      expandSidebar: 'Expand sidebar',
      collapseSidebar: 'Collapse sidebar',
    },
    loginGate: {
      title: 'Chat',
      description: 'Please log in to sync skills and chats.',
      action: 'Log in',
    },
    guest: {
      hint: 'Explore as a guest? Log in for the full experience.',
      action: 'Log in',
    },
    root: {
      watchaAria: 'Visit watcha.cn',
      watchaText: 'A golden moon hangs in a deep blue sky...',
      title: 'How can I help today?',
      description: 'Pick a skill and model to jump into the conversation and keep momentum.',
    },
    emptyMessages: 'No messages yet. Start your first chat.',
    skillPicker: {
      title: 'Select skill',
      description: 'Use arrow keys, Enter to confirm; keyword matching supported.',
      placeholder: 'Search skill name / tags / description',
      empty: 'No matching skills found',
      group: 'Skill list',
    },
    deleteDialog: {
      title: 'Delete this chat?',
      descriptionWithTitle: '“{{title}}” will be permanently deleted and cannot be restored.',
      description: 'This chat will be permanently deleted and cannot be restored.',
      cancel: 'Cancel',
      delete: 'Delete',
    },
    renameDialog: {
      title: 'Rename chat',
      description: 'Set a new name for this chat.',
      placeholder: 'Enter a new chat name',
      cancel: 'Cancel',
      save: 'Save',
    },
    navigator: {
      ariaLabel: 'Message navigator',
      headerLabel: 'message',
      jumpLabel: 'Jump to message {{index}} ({{role}})',
      fallbackGenerating: 'Generating…',
      fallbackEmpty: 'Empty message',
      roleShort: {
        user: 'Y',
        assistant: 'A',
      },
    },
    toasts: {
      skillNotLoaded: 'Skill not loaded. Please try again.',
      skillChosen: 'Skill selected: {{name}}',
      skillSuggestionUpdateFailed: 'Failed to update skill suggestion.',
      skillSuggestionClosed: 'Skill suggestion dismissed.',
      modelUnavailable: 'Model unavailable. Please try again.',
      draftAccepted: 'Skill generated: {{name}}',
      draftFailed: 'Failed to generate skill.',
      draftClosed: 'Draft suggestion dismissed.',
      draftUpdateFailed: 'Failed to update draft suggestion.',
      renameEmpty: 'Please enter a new chat name.',
      renameFailed: 'Rename failed.',
      messageNotFound: 'Message not found.',
    },
  },
})

export type SkillItem = {
  id: string
  name: string
  description: string
  tags: string[]
  avatar?: string | null
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  skill_id?: string | null
}

type ChatLocationState = {
  draft?: string
}

const sortSessions = (sessions: ChatSession[]) => {
  return [...sessions].sort((a, b) => {
    const next = b.updated_at ?? b.created_at ?? ''
    const prev = a.updated_at ?? a.created_at ?? ''
    return next.localeCompare(prev)
  })
}

const toLocalMessage = (message: ApiChatMessage): ChatMessage => {
  if (message.role === 'system') {
    return {
      id: message.id,
      role: 'assistant',
      content: message.content,
      skill_id: message.skill_id ?? null,
    }
  }
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    skill_id: message.skill_id ?? null,
  }
}

const areSessionsEqual = (prev: ChatSession[], next: ChatSession[]) => {
  if (prev.length !== next.length) return false
  for (let i = 0; i < prev.length; i += 1) {
    const previous = prev[i]
    const current = next[i]
    if (!previous || !current) return false
    if (previous.id !== current.id) return false
    if ((previous.title ?? null) !== (current.title ?? null)) return false
    if ((previous.created_at ?? null) !== (current.created_at ?? null)) return false
    if ((previous.updated_at ?? null) !== (current.updated_at ?? null)) return false
  }
  return true
}

const areMessagesEqual = (prev: ChatMessage[], next: ChatMessage[]) => {
  if (prev.length !== next.length) return false
  for (let i = 0; i < prev.length; i += 1) {
    const previous = prev[i]
    const current = next[i]
    if (!previous || !current) return false
    if (previous.id !== current.id) return false
    if (previous.role !== current.role) return false
    if (previous.content !== current.content) return false
    if ((previous.skill_id ?? null) !== (current.skill_id ?? null)) return false
  }
  return true
}

const arePeekEqual = (prev: Record<string, string>, next: Record<string, string>) => {
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  if (prevKeys.length !== nextKeys.length) return false
  for (const key of prevKeys) {
    if (!(key in next)) return false
    if (prev[key] !== next[key]) return false
  }
  return true
}

const MESSAGE_PREVIEW_LIMIT = 10
const CODE_FENCE_PREFIX_REGEX = /^```[a-zA-Z0-9_-]*\s*/
const HTML_COMMENT_PREFIX_REGEX = /^<!--[\s\S]*?-->\s*/i
const CLARIFICATION_PREFIX_REGEX = /^<\!-{1,2}\s*Clarification chain\s*-{1,2}>\s*/i
const STRUCTURAL_ONLY_REGEX = /^[\[\]\{\}\s,]*$/
const CLARIFY_KEYWORD_REGEX = /(clarify_chain|clarify_chain_response|clarification chain)/i
const CLARIFY_QUESTION_REGEX = /"question"\s*:\s*"([^"]+)"/

const stripPreviewPrefix = (value: string, shouldStrip: boolean) => {
  let next = value.trimStart()
  if (!shouldStrip) return next.trim()
  let prev = ''
  while (next && next !== prev) {
    prev = next
    next = next.replace(CLARIFICATION_PREFIX_REGEX, '')
    next = next.replace(HTML_COMMENT_PREFIX_REGEX, '')
    next = next.replace(CODE_FENCE_PREFIX_REGEX, '')
    next = next.trimStart()
  }
  return next.trim()
}

const extractClarifyJson = (value: string) => {
  const normalized = value
    .replace(HTML_COMMENT_PREFIX_REGEX, '')
    .replace(CODE_FENCE_PREFIX_REGEX, '')
    .trim()
  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return normalized.slice(start, end + 1)
}

const getQuestionFromArray = (items: unknown) => {
  if (!Array.isArray(items)) return null
  const first = items[0] as { question?: unknown } | undefined
  if (!first || typeof first !== 'object') return null
  return typeof first.question === 'string' ? first.question : null
}

const extractClarifyQuestion = (content: string) => {
  if (!CLARIFY_KEYWORD_REGEX.test(content)) return ''
  const jsonPayload = extractClarifyJson(content)
  if (jsonPayload) {
    try {
      const parsed = JSON.parse(jsonPayload) as {
        clarify_chain?: Array<{ question?: string }>
        clarify_chain_response?: {
          single_choice?: Array<{ question?: string }>
          ranking?: Array<{ question?: string }>
          free_text?: Array<{ question?: string }>
        }
      }
      const chainQuestion = getQuestionFromArray(parsed.clarify_chain)
      if (chainQuestion) return chainQuestion
      const response = parsed.clarify_chain_response
      const responseQuestion =
        getQuestionFromArray(response?.single_choice) ||
        getQuestionFromArray(response?.ranking) ||
        getQuestionFromArray(response?.free_text)
      if (responseQuestion) return responseQuestion
    } catch {
      // fallback below
    }
  }
  const match = content.match(CLARIFY_QUESTION_REGEX)
  return match?.[1] ?? ''
}

const buildPreviewSource = (content: string, shouldStrip: boolean) => {
  if (!shouldStrip) return content
  const clarifyQuestion = extractClarifyQuestion(content)
  if (clarifyQuestion) return clarifyQuestion
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const firstLine = stripPreviewPrefix(lines[i] ?? '', shouldStrip)
    if (!firstLine || STRUCTURAL_ONLY_REGEX.test(firstLine)) continue
    const merged = [
      firstLine,
      ...lines
        .slice(i + 1)
        .map((line) => stripPreviewPrefix(line, shouldStrip))
        .filter((line) => !!line && !STRUCTURAL_ONLY_REGEX.test(line)),
    ]
      .filter(Boolean)
      .join(' ')
    return merged
  }
  return stripPreviewPrefix(content, shouldStrip)
}

const isClarifyChainMessage = (content: string) => CLARIFY_KEYWORD_REGEX.test(content)

const buildMessagePreview = (content: string, limit = MESSAGE_PREVIEW_LIMIT) => {
  const trimmed = buildPreviewSource(content, isClarifyChainMessage(content)).replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''
  const chars = Array.from(trimmed)
  if (chars.length <= limit) return trimmed
  return chars.slice(0, limit).join('')
}

const buildMessageAnchorId = (messageId: string) => `message-${messageId}`

export default function ChatPage() {
  const { t, i18n } = useTranslation('chat')
  const token = useAppSelector((state) => state.auth.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId: routeSessionId } = useParams()
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<ChatSession | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameCandidate, setRenameCandidate] = useState<ChatSession | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionPeek, setSessionPeek] = useState<Record<string, string>>({})
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionQuery, setSessionQuery] = useState('')
  const [messagesPollingInterval, setMessagesPollingInterval] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [streaming, setStreaming] = useState(false)
  const [watching, setWatching] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([])
  const [dismissedDraftSuggestionIds, setDismissedDraftSuggestionIds] = useState<string[]>([])
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const isRootChat = location.pathname === '/chat'
  const hasDraft = draft.trim().length > 0
  const isComposerCollapsed = !isRootChat && !isAtBottom && !isComposerFocused && !hasDraft
  const messagesRef = useRef<ChatMessage[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const scrollRafRef = useRef<number | null>(null)
  const lastAppliedDraftRef = useRef<string | null>(null)
  const pendingAssistantIdRef = useRef<string | null>(null)
  const streamAssistantIdRef = useRef<string | null>(null)
  const streamErrorRef = useRef(false)
  const completedStreamIdsRef = useRef<Set<string>>(new Set())
  const watchAbortRef = useRef<AbortController | null>(null)
  const watchAttemptedRef = useRef<Set<string>>(new Set())
  const defaultTitle = t('session.defaultTitle')
  const isDefaultTitle = (value: string | null | undefined) => {
    if (!value) return true
    const normalized = value.trim()
    if (!normalized) return true
    const zhDefault = i18n.getFixedT('zh', 'chat')('session.defaultTitle')
    const enDefault = i18n.getFixedT('en', 'chat')('session.defaultTitle')
    return normalized === zhDefault || normalized === enDefault
  }

  useEffect(() => {
    const state = location.state as ChatLocationState | null
    const nextDraft = typeof state?.draft === 'string' ? state.draft.trim() : ''
    if (!nextDraft) return
    if (lastAppliedDraftRef.current === nextDraft) return
    setDraft(nextDraft)
    lastAppliedDraftRef.current = nextDraft
  }, [location.key])

  const [createChatSession, { isLoading: isCreatingSession }] = useCreateChatSessionMutation()
  const [updateChatSessionTitle] = useUpdateChatSessionTitleMutation()
  const [deleteChatSession] = useDeleteChatSessionMutation()
  const [triggerPreview] = useLazyListChatMessagesQuery()

  const { data: skills = [], isLoading: isSkillsLoading, isError: isSkillsError } = useListSkillsQuery(undefined, {
    skip: !token,
  })
  const { data: models = [], isLoading: isModelsLoading, isError: isModelsError } = useListAiModelsQuery(undefined, {
    skip: !token,
  })
  const { data: sessionsData = [], isLoading: isSessionsLoading, isError: isSessionsError } = useListChatSessionsQuery(undefined, {
    skip: !token,
  })
  const {
    data: messagesData = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
  } = useListChatMessagesQuery(
    { sessionId: sessionId ?? '' },
    { skip: !token || !sessionId, pollingInterval: messagesPollingInterval },
  )
  const {
    data: suggestions = [],
    refetch: refetchSuggestions,
  } = useListSkillSuggestionsQuery(
    { sessionId: sessionId ?? '', status: 'pending' },
    { skip: !token || !sessionId },
  )
  const {
    data: draftSuggestions = [],
    refetch: refetchDraftSuggestions,
  } = useListSkillDraftSuggestionsQuery(
    { sessionId: sessionId ?? '', status: 'pending' },
    { skip: !token || !sessionId },
  )
  const [updateSkillSuggestion] = useUpdateSkillSuggestionMutation()
  const [updateSkillDraftSuggestion] = useUpdateSkillDraftSuggestionMutation()
  const [acceptSkillDraftSuggestion] = useAcceptSkillDraftSuggestionMutation()

  useEffect(() => {
    if (streaming || !sessionId) return
    let attempts = 0
    const maxAttempts = 5
    const tick = () => {
      attempts += 1
      refetchSuggestions()
      refetchDraftSuggestions()
      if (attempts >= maxAttempts) {
        window.clearInterval(timer)
      }
    }
    tick()
    const timer = window.setInterval(tick, 2000)
    return () => {
      window.clearInterval(timer)
    }
  }, [refetchSuggestions, refetchDraftSuggestions, sessionId, streaming])

  useEffect(() => {
    setDismissedSuggestionIds([])
    setDismissedDraftSuggestionIds([])
  }, [sessionId])

  const skillById = useMemo(() => Object.fromEntries(skills.map((skill) => [skill.id, skill])), [skills])
  const dismissedSuggestionSet = useMemo(
    () => new Set(dismissedSuggestionIds),
    [dismissedSuggestionIds],
  )
  const dismissedDraftSuggestionSet = useMemo(
    () => new Set(dismissedDraftSuggestionIds),
    [dismissedDraftSuggestionIds],
  )
  const suggestionByMessageId = useMemo(() => {
    const map = new Map<string, SkillSuggestion>()
    suggestions
      .filter((item) => item.status === 'pending' && !dismissedSuggestionSet.has(item.id))
      .forEach((item) => {
        if (item.message_id) {
          map.set(item.message_id, item)
        }
      })
    return map
  }, [dismissedSuggestionSet, suggestions])
  const draftSuggestionByMessageId = useMemo(() => {
    const map = new Map<string, SkillDraftSuggestion>()
    draftSuggestions
      .filter((item) => item.status === 'pending' && !dismissedDraftSuggestionSet.has(item.id))
      .forEach((item) => {
        if (item.message_id) {
          map.set(item.message_id, item)
        }
      })
    return map
  }, [dismissedDraftSuggestionSet, draftSuggestions])
  const filteredSessions = useMemo(() => {
    const keyword = sessionQuery.trim().toLowerCase()
    if (!keyword) return sessions
    return sessions.filter((session) => {
      const title = (session.title ?? '').toLowerCase()
      const preview = (sessionPeek[session.id] ?? '').toLowerCase()
      return title.includes(keyword) || preview.includes(keyword)
    })
  }, [sessions, sessionPeek, sessionQuery])
  const messageNavItems = useMemo(
    () =>
      messages.map((message, index) => ({
        id: message.id,
        preview: buildMessagePreview(message.content),
        role: message.role,
        index: index + 1,
      })),
    [messages],
  )
  const hasMessageNavigator = !isRootChat && messageNavItems.length > 1
  const activeMessageIndex = useMemo(
    () => messageNavItems.findIndex((item) => item.id === activeMessageId),
    [activeMessageId, messageNavItems],
  )

  const handleJumpToMessage = useCallback(
    (messageId: string) => {
      const element = document.getElementById(buildMessageAnchorId(messageId))
      if (!element) {
        dispatch(enqueueAlert({ description: t('toasts.messageNotFound'), variant: 'destructive' }))
        return
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveMessageId(messageId)
    },
    [dispatch],
  )

  const handleNavigatorFocus = useCallback(() => {
    setIsNavigatorExpanded(true)
  }, [])

  const handleNavigatorBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsNavigatorExpanded(false)
  }, [])

  const handleNavigatorMouseEnter = useCallback(() => {
    setIsNavigatorExpanded(true)
  }, [])

  const handleNavigatorMouseLeave = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const activeElement = document.activeElement
    if (activeElement && event.currentTarget.contains(activeElement)) return
    setIsNavigatorExpanded(false)
  }, [])

  const updateMessageNavigator = useCallback(() => {
    const container =
      scrollContainerRef.current ??
      (document.querySelector('[data-chat-scroll="true"]') as HTMLDivElement | null)
    if (!container) return
    scrollContainerRef.current = container
    const scrollTop = container.scrollTop
    const maxScroll = container.scrollHeight - container.clientHeight
    const nextProgress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0
    setScrollProgress((prev) => (prev === nextProgress ? prev : nextProgress))
    if (messages.length === 0) {
      setActiveMessageId((prev) => (prev === null ? prev : null))
      return
    }
    const containerRect = container.getBoundingClientRect()
    const cutoff = scrollTop + 120
    let nextActiveId = messages[0]?.id ?? null
    for (const message of messages) {
      const element = document.getElementById(buildMessageAnchorId(message.id))
      if (!element) continue
      const offset = element.getBoundingClientRect().top - containerRect.top + scrollTop
      if (offset <= cutoff) {
        nextActiveId = message.id
      } else {
        break
      }
    }
    setActiveMessageId((prev) => (prev === nextActiveId ? prev : nextActiveId))
  }, [messages])

  const replaceMessageId = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return
    setMessages((prev) => {
      let changed = false
      const next = prev.map((message) => {
        if (message.id !== fromId) return message
        changed = true
        return { ...message, id: toId }
      })
      return changed ? next : prev
    })
  }, [])

  const upsertAssistantMessage = useCallback(
    (messageId: string, content: string, mode: 'replace' | 'append') => {
      setMessages((prev) => {
        const index = prev.findIndex((message) => message.id === messageId)
        if (index === -1) {
          return [
            ...prev,
            {
              id: messageId,
              role: 'assistant',
              content,
              skill_id: null,
            },
          ]
        }
        const current = prev[index]
        const nextContent = mode === 'replace' ? content : `${current.content}${content}`
        if (nextContent === current.content) return prev
        const next = [...prev]
        next[index] = { ...current, content: nextContent }
        return next
      })
    },
    [],
  )

  useEffect(() => {
    if (!token) return
    if (sessionsData.length === 0) {
      setSessions((prev) => (prev.length === 0 ? prev : []))
      setStatus((prev) => (prev === 'ready' ? prev : 'ready'))
      return
    }
    const ordered = sortSessions(sessionsData)
    setSessions((prev) => (areSessionsEqual(prev, ordered) ? prev : ordered))
    if (!sessionId && !routeSessionId) {
      setSessionId(ordered[0]?.id ?? null)
    }
  }, [token, sessionsData, sessionId, routeSessionId, isCreatingSession, createChatSession])

  useEffect(() => {
    if (!routeSessionId) return
    if (routeSessionId !== sessionId) {
      setSessionId(routeSessionId)
    }
  }, [routeSessionId, sessionId])

  useEffect(() => {
    if (models.length === 0) return
    setSelectedModelId((prev) => prev ?? models[0]?.id ?? null)
  }, [models])

  useEffect(() => {
    setMessages([])
  }, [sessionId])

  useEffect(() => {
    if (!token || !sessionId) {
      setMessagesPollingInterval((prev) => (prev === 0 ? prev : 0))
      return
    }
    if (streaming || watching) {
      setMessagesPollingInterval((prev) => (prev === 0 ? prev : 0))
      return
    }
    const lastMessage = messagesData[messagesData.length - 1]
    const shouldPoll = lastMessage?.role === 'assistant' && !lastMessage.content.trim()
    const nextInterval = shouldPoll ? 2000 : 0
    setMessagesPollingInterval((prev) => (prev === nextInterval ? prev : nextInterval))
  }, [messagesData, sessionId, streaming, token, watching])

  useEffect(() => {
    if (!sessionId) return
    const nextMessages = messagesData.map(toLocalMessage)
    const currentMessages = messagesRef.current
    if (
      nextMessages.length === 0 &&
      currentMessages.length > 0 &&
      currentMessages.some((message) => message.id.startsWith('local-'))
    ) {
      return
    }
    setMessages((prev) => {
      const localById = new Map(prev.map((message) => [message.id, message]))
      const nextIds = new Set(nextMessages.map((message) => message.id))
      const merged = nextMessages.map((message) => {
        const local = localById.get(message.id)
        if (local && local.content.length > message.content.length) {
          return local
        }
        return message
      })
      const serverSignatures = new Set(nextMessages.map((message) => `${message.role}:${message.content}`))
      const localOnly = prev.filter(
        (message) =>
          !nextIds.has(message.id) &&
          message.id.startsWith('local-') &&
          !serverSignatures.has(`${message.role}:${message.content}`),
      )
      const combined = localOnly.length > 0 ? [...merged, ...localOnly] : merged
      return areMessagesEqual(prev, combined) ? prev : combined
    })
  }, [messagesData, sessionId])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!hasMessageNavigator) {
      setActiveMessageId(null)
      setScrollProgress(0)
      return
    }
    const container = document.querySelector('[data-chat-scroll="true"]') as HTMLDivElement | null
    if (!container) return
    scrollContainerRef.current = container
    const handleScroll = () => {
      if (scrollRafRef.current !== null) return
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null
        updateMessageNavigator()
      })
    }
    updateMessageNavigator()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [hasMessageNavigator, updateMessageNavigator])

  useEffect(() => {
    if (!token || !sessionId || streaming) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant') return
    if (lastMessage.content.trim()) return
    if (completedStreamIdsRef.current.has(lastMessage.id)) return
    const watchKey = `${sessionId}:${lastMessage.id}`
    if (watchAttemptedRef.current.has(watchKey)) return
    watchAttemptedRef.current.add(watchKey)
    const controller = new AbortController()
    watchAbortRef.current?.abort()
    watchAbortRef.current = controller
    setWatching(true)
    watchAiChatStream(
      { sessionId },
      {
        onStart: (messageId, content) => {
          upsertAssistantMessage(messageId, content, 'replace')
        },
        onSnapshot: (messageId, snapshot) => {
          upsertAssistantMessage(messageId, snapshot, 'replace')
        },
        onDelta: (delta, messageId) => {
          upsertAssistantMessage(messageId, delta, 'append')
        },
        onError: () => {
          setStatus('error')
        },
      },
      { signal: controller.signal },
    )
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('error')
        }
      })
      .finally(() => {
        setWatching(false)
      })
    return () => {
      controller.abort()
      setWatching(false)
    }
  }, [messages, sessionId, streaming, token, upsertAssistantMessage])


  useEffect(() => {
    if (sessions.length === 0) return
    let alive = true
    const loadPreview = async () => {
      const results = await Promise.all(
        sessions.map(async (session) => {
          try {
            const response = await triggerPreview({ sessionId: session.id, limit: 1 }).unwrap()
            const preview = response[0]?.content ?? ''
            return [session.id, preview] as const
          } catch {
            return [session.id, ''] as const
          }
        }),
      )
      if (alive) {
        setSessionPeek((prev) => {
          const next = Object.fromEntries(results)
          return arePeekEqual(prev, next) ? prev : next
        })
      }
    }
    loadPreview()
    return () => {
      alive = false
    }
  }, [sessions, triggerPreview])

  const isLoading =
    isCreatingSession ||
    isSkillsLoading ||
    isModelsLoading ||
    isMessagesLoading ||
    isSessionsLoading ||
    status === 'loading'
  const isError = status === 'error' || isSkillsError || isModelsError || isMessagesError || isSessionsError
  const viewStatus: 'loading' | 'ready' | 'error' = isError ? 'error' : isLoading ? 'loading' : 'ready'

  const sendMessageWithContent = async (
    content: string,
    skillId?: string | null,
    options?: { preserveDraft?: boolean; preserveSkill?: boolean },
  ) => {
    if (!content.trim() || !selectedModelId) return
    watchAbortRef.current?.abort()
    setWatching(false)
    streamErrorRef.current = false
    let activeSessionId = sessionId
    let shouldUpdateTitle = false
    if (!activeSessionId || isRootChat) {
      try {
        const session = await createChatSession({ title: defaultTitle }).unwrap()
        activeSessionId = session.id
        setSessionId(session.id)
        setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
        shouldUpdateTitle = true
      } catch {
        setStatus('error')
        return
      }
    }
    if (activeSessionId && isRootChat) {
      navigate(`/chat/${activeSessionId}`)
    }
    const trimmedContent = content.trim()
    const activeSession = sessions.find((session) => session.id === activeSessionId)
    if (activeSession && isDefaultTitle(activeSession.title)) {
      shouldUpdateTitle = true
    }
    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: trimmedContent,
      skill_id: skillId ?? null,
    }
    const assistantId = `local-assistant-${Date.now()}`
    pendingAssistantIdRef.current = assistantId
    streamAssistantIdRef.current = assistantId
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', skill_id: null },
    ])
    if (!options?.preserveDraft) {
      setDraft('')
    }
    if (!options?.preserveSkill) {
      setSelectedSkill(null)
    }
    setStreaming(true)
    try {
      if (shouldUpdateTitle && activeSessionId) {
        const nextTitle =
          trimmedContent.length > 24 ? `${trimmedContent.slice(0, 24)}...` : trimmedContent
        updateChatSessionTitle({ sessionId: activeSessionId, title: nextTitle })
          .unwrap()
          .then((updated) => {
            setSessions((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)])
          })
          .catch(() => undefined)
      }
      setSessionPeek((prev) => ({
        ...prev,
        [activeSessionId]: prev[activeSessionId] ?? trimmedContent,
      }))
      await streamAiChat(
        {
          sessionId: activeSessionId,
          content: trimmedContent,
          model: selectedModelId,
          skillId: userMessage.skill_id ?? null,
        },
        {
          onStart: (messageId) => {
            const pendingId = pendingAssistantIdRef.current
            if (pendingId) {
              replaceMessageId(pendingId, messageId)
            }
            pendingAssistantIdRef.current = messageId
            streamAssistantIdRef.current = messageId
          },
          onSnapshot: (messageId, snapshot) => {
            upsertAssistantMessage(messageId, snapshot, 'replace')
          },
          onDelta: (delta, messageId) => {
            const targetId = messageId || streamAssistantIdRef.current || assistantId
            upsertAssistantMessage(targetId, delta, 'append')
          },
          onError: () => {
            streamErrorRef.current = true
            setStatus('error')
          },
        },
      )
    } catch {
      streamErrorRef.current = true
      setStatus('error')
    } finally {
      const completedId = streamAssistantIdRef.current
      if (completedId && !streamErrorRef.current) {
        completedStreamIdsRef.current.add(completedId)
      }
      pendingAssistantIdRef.current = null
      streamAssistantIdRef.current = null
      setStreaming(false)
    }
  }

  const handleSend = async () => {
    await sendMessageWithContent(draft, selectedSkill?.id ?? null)
  }

  const handleClarifyComplete = useCallback(
    async (payload: {
      responses: {
        single_choice: { question: string; answer: string | null }[]
        ranking: { question: string; order: string[] }[]
        free_text: { question: string; answer: string }[]
      }
    }) => {
      const response = {
        clarify_chain_response: payload.responses,
      }
      const content = `\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``
      await sendMessageWithContent(content, null, { preserveDraft: true, preserveSkill: true })
    },
    [sendMessageWithContent],
  )

  const handleUseSuggestion = useCallback(
    async (suggestion: SkillSuggestion) => {
      if (!sessionId) return
      const skill = skillById[suggestion.skill_id]
      if (!skill) {
        dispatch(enqueueAlert({ description: t('toasts.skillNotLoaded'), variant: 'destructive' }))
        return
      }
      setSelectedSkill(skill)
      setDismissedSuggestionIds((prev) => [...prev, suggestion.id])
      try {
        await updateSkillSuggestion({
          sessionId,
          suggestionId: suggestion.id,
          status: 'accepted',
        }).unwrap()
        dispatch(enqueueAlert({ description: t('toasts.skillChosen', { name: skill.name }) }))
      } catch {
        dispatch(enqueueAlert({ description: t('toasts.skillSuggestionUpdateFailed'), variant: 'destructive' }))
      }
    },
    [dispatch, sessionId, skillById, updateSkillSuggestion],
  )

  const handleRejectSuggestion = useCallback(
    async (suggestion: SkillSuggestion) => {
      if (!sessionId) return
      setDismissedSuggestionIds((prev) => [...prev, suggestion.id])
      try {
        await updateSkillSuggestion({
          sessionId,
          suggestionId: suggestion.id,
          status: 'rejected',
        }).unwrap()
        dispatch(enqueueAlert({ description: t('toasts.skillSuggestionClosed') }))
      } catch {
        dispatch(enqueueAlert({ description: t('toasts.skillSuggestionUpdateFailed'), variant: 'destructive' }))
      }
    },
    [dispatch, sessionId, updateSkillSuggestion],
  )

  const handleDismissSuggestion = useCallback(
    async (suggestion: SkillSuggestion) => {
      await handleRejectSuggestion(suggestion)
    },
    [handleRejectSuggestion],
  )

  const handleAcceptDraftSuggestion = useCallback(
    async (suggestion: SkillDraftSuggestion) => {
      if (!sessionId) return
    const modelId = selectedModelId ?? models[0]?.id ?? null
    if (!modelId) {
      dispatch(enqueueAlert({ description: t('toasts.modelUnavailable'), variant: 'destructive' }))
      return
    }
      setDismissedDraftSuggestionIds((prev) => [...prev, suggestion.id])
      try {
        const result = await acceptSkillDraftSuggestion({
          sessionId,
          suggestionId: suggestion.id,
          modelId,
        }).unwrap()
        dispatch(enqueueAlert({ description: t('toasts.draftAccepted', { name: result.name }) }))
      } catch {
        dispatch(enqueueAlert({ description: t('toasts.draftFailed'), variant: 'destructive' }))
      }
    },
    [acceptSkillDraftSuggestion, dispatch, models, selectedModelId, sessionId],
  )

  const handleRejectDraftSuggestion = useCallback(
    async (suggestion: SkillDraftSuggestion) => {
      if (!sessionId) return
      setDismissedDraftSuggestionIds((prev) => [...prev, suggestion.id])
      try {
        await updateSkillDraftSuggestion({
          sessionId,
          suggestionId: suggestion.id,
          status: 'rejected',
        }).unwrap()
        dispatch(enqueueAlert({ description: t('toasts.draftClosed') }))
      } catch {
        dispatch(enqueueAlert({ description: t('toasts.draftUpdateFailed'), variant: 'destructive' }))
      }
    },
    [dispatch, sessionId, updateSkillDraftSuggestion],
  )

  const handleDismissDraftSuggestion = useCallback(
    async (suggestion: SkillDraftSuggestion) => {
      await handleRejectDraftSuggestion(suggestion)
    },
    [handleRejectDraftSuggestion],
  )

  const handlePick = (skill: SkillItem) => {
    setSelectedSkill(skill)
    setOpen(false)
  }

  const handleCreateSession = () => {
    navigate('/chat')
  }

  const handleSelectSession = (session: ChatSession) => {
    const isSameSession = session.id === sessionId
    if (!isSameSession) {
      setSessionId(session.id)
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
    }
    if (!isSameSession || isRootChat) {
      navigate(`/chat/${session.id}`)
    }
  }

  const handleRequestRenameSession = (session: ChatSession) => {
    setRenameCandidate(session)
    const currentTitle = session.title?.trim() ?? ''
    setRenameValue(currentTitle && !isDefaultTitle(currentTitle) ? currentTitle : '')
    setRenameDialogOpen(true)
  }

  const handleConfirmRenameSession = async () => {
    if (!renameCandidate) return
    const target = renameCandidate
    const nextTitle = renameValue.trim()
    if (!nextTitle) {
      dispatch(enqueueAlert({ description: t('toasts.renameEmpty'), variant: 'destructive' }))
      return
    }
    const currentTitle = target.title?.trim() ?? ''
    if (nextTitle === currentTitle) {
      setRenameDialogOpen(false)
      setRenameCandidate(null)
      return
    }
    setRenameDialogOpen(false)
    setRenameCandidate(null)
    await handleRenameSession(target.id, nextTitle)
  }

  const handleRenameSession = async (targetId: string, title: string) => {
    try {
      const updated = await updateChatSessionTitle({ sessionId: targetId, title }).unwrap()
      setSessions((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)])
    } catch {
      dispatch(enqueueAlert({ description: t('toasts.renameFailed'), variant: 'destructive' }))
    }
  }

  const handleRequestDeleteSession = (session: ChatSession) => {
    setDeleteCandidate(session)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteSession = async () => {
    if (!deleteCandidate) return
    const target = deleteCandidate
    setDeleteDialogOpen(false)
    setDeleteCandidate(null)
    await handleDeleteSession(target)
  }

  const handleDeleteSession = async (session: ChatSession) => {
    const remaining = sessions.filter((item) => item.id !== session.id)
    setSessions(remaining)
    setSessionPeek((prev) => {
      const next = { ...prev }
      delete next[session.id]
      return next
    })
    if (session.id === sessionId) {
      const fallback = remaining[0] ?? null
      setSessionId(fallback?.id ?? null)
      if (!fallback) {
        setMessages([])
      }
    }
    try {
      await deleteChatSession(session.id).unwrap()
    } catch {
      setStatus('error')
    }
  }

  if (!token) {
    return (
      <section className="rounded-[28px] border border-border/70 bg-white px-8 py-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">WenDui</p>
          <h2 className="text-2xl font-semibold">{t('loginGate.title')}</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t('loginGate.description')}</p>
        <Button variant="outline" className="mt-5 rounded-full px-6" onClick={() => navigate('/login')}>
          {t('loginGate.action')}
        </Button>
      </section>
    )
  }

  return (
    <section
      className={[
        'grid h-full min-h-0 w-full gap-8 lg:gap-0',
        isSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]',
      ].join(' ')}
    >
      <h2 className="sr-only">{t('session.defaultTitle')}</h2>
      <aside
        className={[
          'hidden h-full min-h-0 flex-col border-r border-border/60 text-sm text-muted-foreground lg:flex',
          isSidebarCollapsed ? 'px-2' : 'pl-4 pr-5',
        ].join(' ')}
      >
        <div className={['flex min-h-0 flex-1 flex-col', isSidebarCollapsed ? 'gap-3 py-3' : 'gap-4 py-4'].join(' ')}>
          <div className="flex items-start justify-between gap-2">
            <div className={isSidebarCollapsed ? 'sr-only' : 'space-y-1'}>
              <p className="text-xs uppercase tracking-[0.35em]">WenDui</p>
              <p className="text-base font-semibold text-foreground">{t('session.panelTitle')}</p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:border-border hover:text-foreground"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-expanded={!isSidebarCollapsed}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="sr-only">
                {isSidebarCollapsed ? t('session.expandSidebar') : t('session.collapseSidebar')}
              </span>
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <button
                className="flex w-full items-center justify-between rounded-full bg-muted/60 px-4 py-1.5 text-left text-foreground"
                onClick={handleCreateSession}
              >
                {t('session.new')}
                <span className="text-xs text-muted-foreground">+</span>
              </button>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="text-xs uppercase tracking-[0.35em]">{t('session.history')}</div>
                <input
                  value={sessionQuery}
                  onChange={(event) => setSessionQuery(event.target.value)}
                  placeholder={t('session.searchPlaceholder')}
                  className="h-8 w-full rounded-full border border-border/70 bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground"
                />
                <ScrollArea className="min-h-0 flex-1 pr-2" scrollbarClassName="w-[5px] p-0">
                  <div className="space-y-1 text-sm">
                    {filteredSessions.length === 0 && (
                        <Alert className="rounded-2xl border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground shadow-none">
                          <AlertDescription className="text-xs text-muted-foreground">
                            {t('session.emptyHistory')}
                          </AlertDescription>
                        </Alert>
                    )}
                    {filteredSessions.map((session) => {
                      const sessionTitle = session.title?.trim()
                      const fallbackTitle = sessionPeek[session.id]?.trim()
                      const resolvedTitle =
                        sessionTitle && !isDefaultTitle(sessionTitle)
                          ? sessionTitle
                          : fallbackTitle && !isDefaultTitle(fallbackTitle)
                            ? fallbackTitle
                            : t('session.untitled')
                      const displayTitle =
                        resolvedTitle.length > 24 ? `${resolvedTitle.slice(0, 24)}...` : resolvedTitle
                      const isActive = session.id === sessionId
                      return (
                        <div
                          key={session.id}
                          className={[
                            'group flex items-center gap-2 rounded-2xl px-3 py-1 transition',
                            isActive
                              ? 'bg-muted/60 text-foreground'
                              : 'text-muted-foreground hover:bg-muted/50',
                          ].join(' ')}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectSession(session)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleSelectSession(session)
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="flex-1 text-left"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleSelectSession(session)
                            }}
                          >
                            <div className="line-clamp-1 text-sm font-medium">{displayTitle}</div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              className="rounded-full border border-transparent px-2 py-1 text-[10px] text-muted-foreground hover:border-border/70 hover:text-foreground"
                              onClick={() => handleRequestRenameSession(session)}
                            >
                              {t('session.rename')}
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-transparent px-2 py-1 text-[10px] text-muted-foreground hover:border-border/70 hover:text-foreground"
                              onClick={() => handleRequestDeleteSession(session)}
                            >
                              {t('session.delete')}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            </div>
          </div>
          )}
        </div>
        {!isSidebarCollapsed && <div className="pb-4 pt-3 text-xs text-muted-foreground">Powered by WenDui</div>}
      </aside>

      <div className={['flex h-full min-h-0 flex-col gap-8', isSidebarCollapsed ? 'lg:pl-6' : 'lg:pl-8'].join(' ')}>
        {!token && (
          <div className="flex items-center justify-between">
            <div className="hidden h-9 items-center rounded-full border border-border/70 bg-white px-4 text-xs text-muted-foreground lg:flex">
              {t('guest.hint')}
            </div>
            <Button variant="outline" className="rounded-full px-5" onClick={() => navigate('/login')}>
              {t('guest.action')}
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={[
              'mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col',
              isRootChat ? 'pt-[20vh]' : '',
            ].join(' ')}
            data-testid="chat-right-panel"
          >
            {isRootChat ? (
              <>
                <div className="flex justify-center">
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-1 text-xs text-muted-foreground transition hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    href="https://watcha.cn/?utm_source=wendui"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('root.watchaAria')}
                  >
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase text-white">
                      2026
                    </span>
                    {t('root.watchaText')}
                  </a>
                </div>
                <div className="mt-8 text-center">
                  <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{t('root.title')}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('root.description')}
                  </p>
                </div>

                <ChatComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={handleSend}
                  onTriggerSkill={() => setOpen(true)}
                  models={models}
                  selectedModelId={selectedModelId}
                  onModelChange={setSelectedModelId}
                  disabled={streaming || watching}
                  selectedSkillName={selectedSkill?.name ?? null}
                  collapsed={isComposerCollapsed}
                  onFocusChange={setIsComposerFocused}
                />
              </>
            ) : (
              <>
              <div className="relative mt-6 min-h-0 flex-1">
                <Conversation className="min-h-0 flex-1" data-chat-scroll="true">
                  <ConversationContent className="flex flex-col gap-4">
                    {messages.length === 0 && viewStatus === 'ready' && (
                      <Alert className="rounded-2xl border-dashed border-border/60 bg-white/60 p-4 text-sm text-muted-foreground shadow-none">
                        <AlertDescription className="text-muted-foreground">
                          {t('emptyMessages')}
                        </AlertDescription>
                      </Alert>
                    )}
                    {messages.map((message, index) => {
                      const badgeSkill = message.skill_id ? skillById[message.skill_id] : null
                      const suggestion =
                        message.role === 'assistant' ? suggestionByMessageId.get(message.id) : null
                      const suggestionSkill = suggestion ? skillById[suggestion.skill_id] ?? null : null
                      const draftSuggestion =
                        message.role === 'assistant' ? draftSuggestionByMessageId.get(message.id) : null
                      return (
                        <Message
                          key={message.id}
                          from={message.role}
                          id={buildMessageAnchorId(message.id)}
                          data-message-index={index + 1}
                        >
                          <div className="flex w-full flex-col gap-2">
                            <ChatBubble
                              role={message.role}
                              content={message.content}
                              skillName={badgeSkill?.name ?? undefined}
                              messageId={message.id}
                              onClarifyComplete={handleClarifyComplete}
                            />
                            {suggestion && (
                              <SkillSuggestionCard
                                skill={suggestionSkill}
                                reason={suggestion.reason ?? null}
                                onUse={() => handleUseSuggestion(suggestion)}
                                onDismiss={() => handleDismissSuggestion(suggestion)}
                                onReject={() => handleRejectSuggestion(suggestion)}
                              />
                            )}
                            {draftSuggestion && (
                              <SkillDraftSuggestionCard
                                goal={draftSuggestion.goal}
                                constraints={draftSuggestion.constraints ?? null}
                                reason={draftSuggestion.reason ?? null}
                                onAccept={() => handleAcceptDraftSuggestion(draftSuggestion)}
                                onDismiss={() => handleDismissDraftSuggestion(draftSuggestion)}
                                onReject={() => handleRejectDraftSuggestion(draftSuggestion)}
                              />
                            )}
                          </div>
                        </Message>
                      )
                    })}
                  </ConversationContent>
                  <ConversationScrollButton className="bottom-6 right-6 left-auto translate-x-0 shadow-md" />
                  <ConversationScrollState onAtBottomChange={setIsAtBottom} />
                </Conversation>
                {hasMessageNavigator && (
                  <div className="pointer-events-none absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
                    <div
                      className={[
                        'pointer-events-auto flex items-center gap-3 bg-transparent transition-all duration-200',
                        isNavigatorExpanded ? 'w-72 px-2 py-3' : 'w-10 px-1.5 py-2',
                      ].join(' ')}
                      onMouseEnter={handleNavigatorMouseEnter}
                      onMouseLeave={handleNavigatorMouseLeave}
                      onFocus={handleNavigatorFocus}
                      onBlur={handleNavigatorBlur}
                      aria-expanded={isNavigatorExpanded}
                      role="navigation"
                      aria-label={t('navigator.ariaLabel')}
                      tabIndex={0}
                      data-testid="message-navigator"
                    >
                      <div className="relative flex h-44 w-4 items-center justify-center">
                        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-border/60" />
                        <div
                          className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2 rounded-full bg-foreground/70 transition-[height] duration-200"
                          style={{ height: `${Math.round(scrollProgress * 100)}%` }}
                        />
                        {messageNavItems.map((item, index) => {
                          const total = messageNavItems.length
                          const percent = total === 1 ? 0 : (index / (total - 1)) * 100
                          const isActive = item.id === activeMessageId
                          const dotColor =
                            item.role === 'user'
                              ? isActive
                                ? 'bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                                : 'bg-primary/70'
                              : isActive
                                ? 'bg-foreground shadow-[0_0_0_3px_rgba(15,23,42,0.12)]'
                                : 'bg-foreground/70'
                          return (
                            <button
                              key={`dot-${item.id}`}
                              type="button"
                              className={[
                                'absolute left-1/2 -translate-x-1/2 rounded-full transition-all',
                                isActive ? 'h-2.5 w-2.5' : 'h-2 w-2',
                                dotColor,
                              ].join(' ')}
                              style={{ top: `calc(${percent}% - ${isActive ? 5 : 4}px)` }}
                              onClick={() => handleJumpToMessage(item.id)}
                              aria-label={t('navigator.jumpLabel', {
                                index: item.index,
                                role:
                                  item.role === 'user'
                                    ? t('navigator.roleShort.user')
                                    : t('navigator.roleShort.assistant'),
                              })}
                            />
                          )
                        })}
                        {!isNavigatorExpanded && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-white shadow-sm">
                            {messageNavItems.length}
                          </div>
                        )}
                      </div>

                        {isNavigatorExpanded && (
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                              <span>{t('navigator.headerLabel')}</span>
                              <span>
                                {activeMessageIndex >= 0
                                  ? `${activeMessageIndex + 1}/${messageNavItems.length}`
                                  : messageNavItems.length}
                              </span>
                            </div>
                            <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                          {messageNavItems.map((item) => {
                            const isActive = item.id === activeMessageId
                            const fallback =
                              item.role === 'assistant'
                                ? t('navigator.fallbackGenerating')
                                : t('navigator.fallbackEmpty')
                            const roleLabel =
                              item.role === 'user'
                                ? t('navigator.roleShort.user')
                                : t('navigator.roleShort.assistant')
                            return (
                              <button
                                key={`nav-${item.id}`}
                                type="button"
                                className={[
                                  'flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition',
                                    isActive
                                      ? 'bg-muted text-foreground'
                                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                  ].join(' ')}
                                onClick={() => handleJumpToMessage(item.id)}
                              >
                                <span
                                  className={[
                                    'h-1.5 w-1.5 rounded-full',
                                    item.role === 'user' ? 'bg-primary' : 'bg-foreground/60',
                                  ].join(' ')}
                                />
                                <span className="min-w-0 flex-1 truncate">{item.preview || fallback}</span>
                                <span
                                  className={[
                                    'rounded-full border px-1.5 py-0.5 text-[10px]',
                                    item.role === 'user'
                                      ? 'border-primary/30 text-primary'
                                      : 'border-border/70 text-muted-foreground',
                                  ].join(' ')}
                                >
                                  {roleLabel}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70">{item.index}</span>
                              </button>
                            )
                          })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

                <ChatComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={handleSend}
                  onTriggerSkill={() => setOpen(true)}
                  models={models}
                  selectedModelId={selectedModelId}
                  onModelChange={setSelectedModelId}
                  disabled={streaming || watching}
                  selectedSkillName={selectedSkill?.name ?? null}
                  collapsed={isComposerCollapsed}
                  onFocusChange={setIsComposerFocused}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('skillPicker.title')}</DialogTitle>
            <DialogDescription>{t('skillPicker.description')}</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder={t('skillPicker.placeholder')} />
            <CommandList>
              <CommandEmpty>{t('skillPicker.empty')}</CommandEmpty>
              <CommandGroup heading={t('skillPicker.group')}>
                {skills.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    value={`${skill.name} ${skill.description} ${skill.tags.join(' ')}`}
                    onSelect={() => handlePick(skill)}
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{skill.name}</span>
                        {skill.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{skill.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameDialogOpen}
        onOpenChange={(nextOpen) => {
          setRenameDialogOpen(nextOpen)
          if (!nextOpen) {
            setRenameCandidate(null)
            setRenameValue('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('renameDialog.title')}</DialogTitle>
            <DialogDescription>{t('renameDialog.description')}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              handleConfirmRenameSession()
            }}
          >
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder={t('renameDialog.placeholder')}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setRenameDialogOpen(false)}>
                {t('renameDialog.cancel')}
              </Button>
              <Button type="submit">{t('renameDialog.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          setDeleteDialogOpen(nextOpen)
          if (!nextOpen) {
            setDeleteCandidate(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {deleteCandidate?.title?.trim()
                ? t('deleteDialog.descriptionWithTitle', { title: deleteCandidate.title.trim() })
                : t('deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSession}>
              {t('deleteDialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export const __testables__ = {
  areSessionsEqual,
  areMessagesEqual,
  arePeekEqual,
}
