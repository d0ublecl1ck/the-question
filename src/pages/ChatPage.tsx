import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useAppSelector } from '@/store/hooks'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ChatComposer from '@/components/chat/ChatComposer'
import ChatBubble from '@/components/chat/ChatBubble'
import { Message } from '@/components/ui/message'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/conversation'
import { streamAiChat, watchAiChatStream } from '@/store/api/aiStream'
import {
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
  useLazyListChatMessagesQuery,
  useListChatMessagesQuery,
  useListChatSessionsQuery,
  useListSkillsQuery,
  useUpdateChatSessionTitleMutation,
} from '@/store/api/chatApi'
import { useListAiModelsQuery } from '@/store/api/aiApi'
import type { ChatMessage as ApiChatMessage, ChatSession } from '@/store/api/types'

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
  const token = useAppSelector((state) => state.auth.token)
  const user = useAppSelector((state) => state.auth.user)
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
  const isRootChat = location.pathname === '/chat'
  const messagesRef = useRef<ChatMessage[]>([])
  const lastAppliedDraftRef = useRef<string | null>(null)
  const pendingAssistantIdRef = useRef<string | null>(null)
  const streamAssistantIdRef = useRef<string | null>(null)
  const streamErrorRef = useRef(false)
  const completedStreamIdsRef = useRef<Set<string>>(new Set())
  const watchAbortRef = useRef<AbortController | null>(null)
  const watchAttemptedRef = useRef<Set<string>>(new Set())

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

  const skillById = useMemo(() => Object.fromEntries(skills.map((skill) => [skill.id, skill])), [skills])
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
        const session = await createChatSession({ title: '对话' }).unwrap()
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
    if (activeSession && (!activeSession.title || activeSession.title === '对话')) {
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
    async (payload: { selection: string | null; ranking: string[]; freeText: string }) => {
      const response = {
        clarify_chain_response: {
          single_choice: payload.selection,
          ranking: payload.ranking,
          free_text: payload.freeText,
        },
      }
      const content = `\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``
      await sendMessageWithContent(content, null, { preserveDraft: true, preserveSkill: true })
    },
    [sendMessageWithContent],
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
          <h2 className="text-2xl font-semibold">对话</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">请先登录以同步技能与对话。</p>
        <Button variant="outline" className="mt-5 rounded-full px-6" onClick={() => navigate('/login')}>
          去登录
        </Button>
      </section>
    )
  }

  return (
    <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-[2fr_8fr]">
      <h2 className="sr-only">对话</h2>
      <aside className="hidden h-full min-h-0 flex-col rounded-[28px] border border-border/70 bg-white/80 px-5 py-6 text-sm text-muted-foreground lg:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em]">WenDui</p>
            <p className="text-base font-semibold text-foreground">对话台</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <button
              className="flex w-full items-center justify-between rounded-full bg-muted/60 px-4 py-2 text-left text-foreground"
              onClick={handleCreateSession}
            >
              新建
              <span className="text-xs text-muted-foreground">+</span>
            </button>
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="text-xs uppercase tracking-[0.35em]">历史对话</div>
              <input
                value={sessionQuery}
                onChange={(event) => setSessionQuery(event.target.value)}
                placeholder="搜索对话"
                className="h-9 w-full rounded-full border border-border/70 bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground"
              />
              <ScrollArea className="min-h-0 flex-1 pr-2">
                <div className="space-y-2 text-sm">
                  {filteredSessions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
                      暂无历史对话
                    </div>
                  )}
                  {filteredSessions.map((session) => {
                    const title = session.title?.trim() || '未命名对话'
                    const isActive = session.id === sessionId
                    return (
                      <div
                        key={session.id}
                        className={[
                          'group flex items-start gap-2 rounded-2xl px-3 py-2 transition',
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
                          <div className="text-sm font-medium">{title}</div>
                          {sessionPeek[session.id] && (
                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {sessionPeek[session.id]}
                            </div>
                          )}
                          {session.updated_at && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(session.updated_at).toLocaleDateString()}
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-1 rounded-full border border-transparent px-2 py-1 text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-border/70 hover:text-foreground"
                          onClick={() => handleRequestDeleteSession(session)}
                        >
                          删除
                        </button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <div className="pt-4 text-xs text-muted-foreground">Powered by WenDui</div>
      </aside>

      <div className="flex h-full min-h-0 flex-col gap-8">
        {!token && (
          <div className="flex items-center justify-between">
            <div className="hidden h-9 items-center rounded-full border border-border/70 bg-white px-4 text-xs text-muted-foreground lg:flex">
              以访客身份探索？登录以获取完整体验
            </div>
            <Button variant="outline" className="rounded-full px-5" onClick={() => navigate('/login')}>
              登录
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
                    href="https://watcha.cn/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="前往 watcha.cn"
                  >
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase text-white">
                      2026
                    </span>
                    深蓝的天空中挂着一轮金黄的圆月......
                  </a>
                </div>
                <div className="mt-8 text-center">
                  <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">今天可以帮你做什么？</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    选择技能与模型，快速进入对话并保持连续行动。
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
                />
              </>
            ) : (
              <>
              <Conversation className="mt-6 min-h-0 flex-1">
                <ConversationContent className="flex flex-col gap-4">
                  {messages.length === 0 && viewStatus === 'ready' && (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-4 text-sm text-muted-foreground">
                      还没有消息，开始你的第一条对话。
                    </div>
                  )}
                  {messages.map((message) => {
                    const badgeSkill = message.skill_id ? skillById[message.skill_id] : null
                    return (
                      <Message key={message.id} from={message.role}>
                        <ChatBubble
                          role={message.role}
                          content={message.content}
                          skillName={badgeSkill?.name ?? undefined}
                          messageId={message.id}
                          onClarifyComplete={handleClarifyComplete}
                        />
                      </Message>
                    )
                  })}
                </ConversationContent>
                <ConversationScrollButton />
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
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>选择技能</DialogTitle>
            <DialogDescription>上下键选择，回车确认；支持关键词匹配。</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="搜索技能名称 / 标签 / 描述" />
            <CommandList>
              <CommandEmpty>没有找到匹配的技能</CommandEmpty>
              <CommandGroup heading="技能列表">
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
            <DialogTitle>确认删除对话？</DialogTitle>
            <DialogDescription>
              {deleteCandidate?.title?.trim()
                ? `“${deleteCandidate.title.trim()}”将被永久删除，无法恢复。`
                : '该对话将被永久删除，无法恢复。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSession}>
              删除
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
