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
import { useAuthStore } from '@/stores/authStore'
import {
  createChatSession,
  createSkillSuggestion,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  updateChatSessionTitle,
  type ChatSession,
} from '@/services/chat'
import { useNavigate } from 'react-router-dom'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import { listAiModels, streamAiChat, type AiModelOption } from '@/services/ai'
import { authFetch } from '@/services/http'

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

export default function ChatPage() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionPeek, setSessionPeek] = useState<Record<string, string>>({})
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [models, setModels] = useState<AiModelOption[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionQuery, setSessionQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [streaming, setStreaming] = useState(false)

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
    let alive = true
    const load = async () => {
      setStatus('loading')
      try {
        const [sessionsResult, skillResult, modelResult] = await Promise.allSettled([
          listChatSessions(),
          authFetch('/api/v1/skills'),
          listAiModels(),
        ])

        const modelList = modelResult.status === 'fulfilled' ? modelResult.value : []
        if (!alive) return
        setModels(modelList)
        setSelectedModelId((prev) => prev ?? modelList[0]?.id ?? null)

        if (skillResult.status !== 'fulfilled' || !skillResult.value.ok) {
          throw new Error('Load skills failed')
        }
        const skillData = (await skillResult.value.json()) as SkillItem[]
        if (!alive) return

        setSkills(skillData)

        const sessionList =
          sessionsResult.status === 'fulfilled' ? sessionsResult.value : []
        let activeSession = sessionList[0] ?? null
        if (!activeSession) {
          const created = await createChatSession('对话')
          activeSession = created
        }

        const orderedSessions = [...sessionList].sort((a, b) => {
          const next = b.updated_at ?? b.created_at ?? ''
          const prev = a.updated_at ?? a.created_at ?? ''
          return next.localeCompare(prev)
        })
        if (activeSession && !orderedSessions.find((session) => session.id === activeSession?.id)) {
          orderedSessions.unshift(activeSession)
        }
        setSessions(orderedSessions)

        if (!activeSession) {
          throw new Error('Create session failed')
        }
        setSessionId(activeSession.id)

        const history = await listChatMessages(activeSession.id)
        if (!alive) return
        setMessages(history)
        const previewEntries = await Promise.all(
          orderedSessions.map(async (session) => {
            try {
              const preview = await listChatMessages(session.id, { limit: 1 })
              return [session.id, preview[0]?.content ?? ''] as const
            } catch (error) {
              return [session.id, ''] as const
            }
          }),
        )
        if (alive) {
          setSessionPeek(Object.fromEntries(previewEntries))
        }
        setStatus('ready')
      } catch (error) {
        if (!alive) return
        setStatus('error')
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [token])

  const handleSend = async () => {
    if (!draft.trim() || !selectedModelId) return
    let activeSessionId = sessionId
    let shouldUpdateTitle = false
    if (!activeSessionId) {
      try {
        const session = await createChatSession('对话')
        activeSessionId = session.id
        setSessionId(session.id)
        setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
        shouldUpdateTitle = true
      } catch (error) {
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
        updateChatSessionTitle(activeSessionId, nextTitle)
          .then((updated) => {
            setSessions((prev) => {
              const next = [updated, ...prev.filter((item) => item.id !== updated.id)]
              return next
            })
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
    } catch (error) {
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
      await createSkillSuggestion({ session_id: sessionId, skill_id: selectedSkill.id })
      setSuggestionStatus('success')
    } catch (error) {
      setSuggestionStatus('error')
    }
  }

  const handleCreateSession = async () => {
    setStatus('loading')
    try {
      const session = await createChatSession('对话')
      setSessionId(session.id)
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
      setMessages([])
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const handleSelectSession = async (session: ChatSession) => {
    if (session.id === sessionId) return
    setSessionId(session.id)
    setStatus('loading')
    setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
    try {
      const history = await listChatMessages(session.id)
      setMessages(history)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
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
      if (fallback) {
        setSessionId(fallback.id)
        try {
          const history = await listChatMessages(fallback.id)
          setMessages(history)
          setStatus('ready')
        } catch (error) {
          setStatus('error')
        }
      } else {
        setSessionId(null)
        setMessages([])
      }
    }
    try {
      await deleteChatSession(session.id)
    } catch (error) {
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
    <section className="grid w-full gap-8 lg:grid-cols-[2fr_8fr]">
      <h2 className="sr-only">对话</h2>
      <aside className="hidden h-full flex-col justify-between rounded-[28px] border border-border/70 bg-white/80 px-5 py-6 text-sm text-muted-foreground lg:flex">
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em]">WenDui</p>
            <p className="text-base font-semibold text-foreground">对话台</p>
          </div>
          <div className="space-y-3">
            <button
              className="flex w-full items-center justify-between rounded-full bg-muted/60 px-4 py-2 text-left text-foreground"
              onClick={handleCreateSession}
            >
              新建
              <span className="text-xs text-muted-foreground">+</span>
            </button>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.35em]">历史对话</div>
              <input
                value={sessionQuery}
                onChange={(event) => setSessionQuery(event.target.value)}
                placeholder="搜索对话"
                className="h-9 w-full rounded-full border border-border/70 bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground"
              />
              <ScrollArea className="h-[360px] pr-2">
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
                        <button
                          className="flex-1 text-left"
                          onClick={() => handleSelectSession(session)}
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
        <div className="text-xs text-muted-foreground">Powered by WenDui</div>
      </aside>

      <div className="space-y-8">
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

        <div className="w-full">
          <div className="w-full" data-testid="chat-right-panel">
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              生成幻灯片
            </button>
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              撰写文档
            </button>
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              创建故事线
            </button>
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              批量调研
            </button>
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              分析数据
            </button>
            <button className="rounded-full px-4 py-1.5 hover:bg-muted/40">
              创建网页
            </button>
          </div>

          <div className="mt-10 border-t border-border/50 pt-6">
            <ScrollArea className="h-[280px] pr-2">
              <div className="flex flex-col gap-3">
                {messages.length === 0 && status === 'ready' && (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-white/70 p-3 text-sm text-muted-foreground">
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
                          ? 'max-w-[80%] rounded-2xl border border-border/60 bg-white/80 p-3 text-foreground'
                          : 'ml-auto max-w-[80%] rounded-2xl border border-foreground/10 bg-foreground text-background p-3'
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
          </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                className="gap-2 rounded-full px-6"
                onClick={() => setOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                选择技能
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6"
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
