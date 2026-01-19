import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { enqueueToast } from '@/store/slices/toastSlice'
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
  const isRootChat = location.pathname === '/chat'
  const hasDraft = draft.trim().length > 0
  const isComposerCollapsed = !isRootChat && !isAtBottom && !isComposerFocused && !hasDraft
  const defaultTitle = t('session.defaultTitle')
  const messagesRef = useRef<ChatMessage[]>([])
  const lastAppliedDraftRef = useRef<string | null>(null)
  const pendingAssistantIdRef = useRef<string | null>(null)
  const streamAssistantIdRef = useRef<string | null>(null)
  const streamErrorRef = useRef(false)
  const completedStreamIdsRef = useRef<Set<string>>(new Set())
  const watchAbortRef = useRef<AbortController | null>(null)
  const watchAttemptedRef = useRef<Set<string>>(new Set())
  const defaultTitleSet = new Set([
    i18n.getFixedT('zh', 'chat')('session.defaultTitle'),
    i18n.getFixedT('en', 'chat')('session.defaultTitle'),
  ])
  const isDefaultTitle = (value: string | null | undefined) => {
    if (!value) return false
    return defaultTitleSet.has(value.trim())
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
    if (activeSession && (!activeSession.title || isDefaultTitle(activeSession.title))) {
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
        dispatch(enqueueToast(t('toasts.skillNotLoaded')))
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
        dispatch(enqueueToast(t('toasts.skillChosen', { name: skill.name })))
      } catch {
        dispatch(enqueueToast(t('toasts.skillSuggestionUpdateFailed')))
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
        dispatch(enqueueToast(t('toasts.skillSuggestionClosed')))
      } catch {
        dispatch(enqueueToast(t('toasts.skillSuggestionUpdateFailed')))
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
        dispatch(enqueueToast(t('toasts.modelUnavailable')))
        return
      }
      setDismissedDraftSuggestionIds((prev) => [...prev, suggestion.id])
      try {
        const result = await acceptSkillDraftSuggestion({
          sessionId,
          suggestionId: suggestion.id,
          modelId,
        }).unwrap()
        dispatch(enqueueToast(t('toasts.draftAccepted', { name: result.name })))
      } catch {
        dispatch(enqueueToast(t('toasts.draftFailed')))
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
        dispatch(enqueueToast(t('toasts.draftClosed')))
      } catch {
        dispatch(enqueueToast(t('toasts.draftUpdateFailed')))
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
      <h2 className="sr-only">{t('loginGate.title')}</h2>
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
                      <div className="rounded-2xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
                        {t('session.emptyHistory')}
                      </div>
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
                          <button
                            type="button"
                            className="rounded-full border border-transparent px-2 py-1 text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-border/70 hover:text-foreground"
                            onClick={() => handleRequestDeleteSession(session)}
                          >
                            {t('session.delete')}
                          </button>
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
              <Conversation className="mt-6 min-h-0 flex-1">
                <ConversationContent className="flex flex-col gap-4">
                  {messages.length === 0 && viewStatus === 'ready' && (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-4 text-sm text-muted-foreground">
                      {t('emptyMessages')}
                    </div>
                  )}
                  {messages.map((message) => {
                    const badgeSkill = message.skill_id ? skillById[message.skill_id] : null
                    const suggestion =
                      message.role === 'assistant' ? suggestionByMessageId.get(message.id) : null
                    const suggestionSkill = suggestion ? skillById[suggestion.skill_id] ?? null : null
                    const draftSuggestion =
                      message.role === 'assistant' ? draftSuggestionByMessageId.get(message.id) : null
                    return (
                      <Message key={message.id} from={message.role}>
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
