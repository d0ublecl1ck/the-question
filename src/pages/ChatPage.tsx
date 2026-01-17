import { useEffect, useMemo, useState } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Tag } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { useNavigate } from 'react-router-dom'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import { streamAiChat } from '@/store/api/aiStream'
import {
  useCreateChatSessionMutation,
  useCreateSkillSuggestionMutation,
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
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionPeek, setSessionPeek] = useState<Record<string, string>>({})
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionQuery, setSessionQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [streaming, setStreaming] = useState(false)

  const [createChatSession, { isLoading: isCreatingSession }] = useCreateChatSessionMutation()
  const [updateChatSessionTitle] = useUpdateChatSessionTitleMutation()
  const [deleteChatSession] = useDeleteChatSessionMutation()
  const [createSkillSuggestion] = useCreateSkillSuggestionMutation()
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
    { skip: !token || !sessionId },
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

  useEffect(() => {
    if (!token) return
    if (sessionsData.length === 0) {
      if (!sessionId && !isCreatingSession) {
        setStatus('loading')
        createChatSession({ title: '对话' })
          .unwrap()
          .then((session) => {
            setSessions([session])
            setSessionId(session.id)
            setStatus('ready')
          })
          .catch(() => setStatus('error'))
      }
      return
    }
    const ordered = sortSessions(sessionsData)
    setSessions((prev) => (areSessionsEqual(prev, ordered) ? prev : ordered))
    if (!sessionId) {
      setSessionId(ordered[0]?.id ?? null)
    }
  }, [token, sessionsData, sessionId, isCreatingSession, createChatSession])

  useEffect(() => {
    if (models.length === 0) return
    setSelectedModelId((prev) => prev ?? models[0]?.id ?? null)
  }, [models])

  useEffect(() => {
    if (!sessionId) return
    const nextMessages = messagesData.map(toLocalMessage)
    setMessages((prev) => (areMessagesEqual(prev, nextMessages) ? prev : nextMessages))
  }, [messagesData, sessionId])

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

  const handleSend = async () => {
    if (!draft.trim() || !selectedModelId) return
    let activeSessionId = sessionId
    let shouldUpdateTitle = false
    if (!activeSessionId) {
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
    const content = draft.trim()
    const activeSession = sessions.find((session) => session.id === activeSessionId)
    if (activeSession && (!activeSession.title || activeSession.title === '对话')) {
      shouldUpdateTitle = true
    }
    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content,
      skill_id: selectedSkill?.id ?? null,
    }
    const assistantId = `local-assistant-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', skill_id: null },
    ])
    setDraft('')
    setSelectedSkill(null)
    setStreaming(true)
    try {
      if (shouldUpdateTitle && activeSessionId) {
        const nextTitle = content.length > 24 ? `${content.slice(0, 24)}...` : content
        updateChatSessionTitle({ sessionId: activeSessionId, title: nextTitle })
          .unwrap()
          .then((updated) => {
            setSessions((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)])
          })
          .catch(() => undefined)
      }
      setSessionPeek((prev) => ({
        ...prev,
        [activeSessionId]: prev[activeSessionId] ?? content,
      }))
      await streamAiChat(
        {
          sessionId: activeSessionId,
          content,
          model: selectedModelId,
          skillId: userMessage.skill_id ?? null,
        },
        {
          onDelta: (delta) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: `${message.content}${delta}` }
                  : message,
              ),
            )
          },
          onError: () => {
            setStatus('error')
          },
        },
      )
    } catch {
      setStatus('error')
    } finally {
      setStreaming(false)
    }
  }

  const handlePick = (skill: SkillItem) => {
    setSelectedSkill(skill)
    setOpen(false)
  }

  const requestSuggestion = async () => {
    if (!sessionId || !selectedSkill) return
    setSuggestionStatus('loading')
    try {
      await createSkillSuggestion({ session_id: sessionId, skill_id: selectedSkill.id }).unwrap()
      setSuggestionStatus('success')
    } catch {
      setSuggestionStatus('error')
    }
  }

  const handleCreateSession = async () => {
    setStatus('loading')
    try {
      const session = await createChatSession({ title: '对话' }).unwrap()
      setSessionId(session.id)
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
      setMessages([])
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    if (session.id === sessionId) return
    setSessionId(session.id)
    setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
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
                      >
                        <button className="flex-1 text-left" onClick={() => handleSelectSession(session)}>
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
                          onClick={() => handleDeleteSession(session)}
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
          <div className="flex min-h-0 flex-1 flex-col" data-testid="chat-right-panel">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-1 text-xs text-muted-foreground">
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase text-white">
                  2026
                </span>
                快来领取最高价值 348 美元的奖励
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">今天可以帮你做什么？</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                选择技能与模型，快速进入对话并保持连续行动。
              </p>
            </div>

            <div className="mt-8 rounded-[24px] border border-border/40 bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  使用 $ 快捷触发
                </Badge>
                {selectedSkill && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {selectedSkill.name}
                  </Badge>
                )}
              </div>
              <AI_Prompt
                value={draft}
                onChange={setDraft}
                onSend={handleSend}
                onTriggerSkill={() => setOpen(true)}
                models={models}
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                disabled={streaming}
              />
            </div>

            <ScrollArea className="mt-6 min-h-0 flex-1 rounded-[26px] border border-border/60 bg-white/70 p-5">
              <div className="flex flex-col gap-4">
                {messages.length === 0 && viewStatus === 'ready' && (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-4 text-sm text-muted-foreground">
                    还没有消息，开始你的第一条对话。
                  </div>
                )}
                {messages.map((message) => {
                  const badgeSkill = message.skill_id ? skillById[message.skill_id] : null
                  return (
                    <div
                      key={message.id}
                      className={
                        message.role === 'assistant'
                          ? 'max-w-[78%] rounded-2xl border border-border/60 bg-white/80 p-4 text-foreground'
                          : 'ml-auto max-w-[78%] rounded-2xl border border-foreground/10 bg-foreground text-background p-4'
                      }
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {badgeSkill && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge
                            variant={message.role === 'assistant' ? 'secondary' : 'outline'}
                            className={message.role === 'assistant' ? '' : 'border-white/40 text-white'}
                          >
                            {badgeSkill.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/80 p-4">
              <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)}>
                <Sparkles className="h-4 w-4" />
                选择技能
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={requestSuggestion}
                disabled={!selectedSkill || suggestionStatus === 'loading'}
              >
                {suggestionStatus === 'loading' ? '生成中...' : '触发建议'}
              </Button>
              {suggestionStatus === 'success' && (
                <span className="text-xs text-emerald-600">已生成建议</span>
              )}
              {suggestionStatus === 'error' && (
                <span className="text-xs text-destructive">生成失败，请稍后重试</span>
              )}
            </div>
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
    </section>
  )
}

export const __testables__ = {
  areSessionsEqual,
  areMessagesEqual,
  arePeekEqual,
}
