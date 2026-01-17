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
import { createChatSession, createSkillSuggestion, listChatMessages } from '@/services/chat'
import { useNavigate } from 'react-router-dom'
import { AI_Prompt } from '@/components/ui/animated-ai-input'
import { listAiModels, streamAiChat, type AiModelOption } from '@/services/ai'
import { authFetch } from '@/services/http'

export type SkillItem = {
  id: string
  name: string
  description: string
  tags: string[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  skill_id?: string | null
}

export default function ChatPage() {
  const token = useAppSelector((state) => state.auth.token)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [models, setModels] = useState<AiModelOption[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [streaming, setStreaming] = useState(false)

  const skillById = useMemo(() => Object.fromEntries(skills.map((skill) => [skill.id, skill])), [skills])

  useEffect(() => {
    if (!token) return
    let alive = true
    const load = async () => {
      setStatus('loading')
      try {
        const [sessionResult, skillResult, modelResult] = await Promise.allSettled([
          createChatSession('对话'),
          authFetch('/api/v1/skills'),
          listAiModels(),
        ])

        const modelList = modelResult.status === 'fulfilled' ? modelResult.value : []
        if (!alive) return
        setModels(modelList)
        setSelectedModelId((prev) => prev ?? modelList[0]?.id ?? null)

        if (sessionResult.status !== 'fulfilled') {
          throw new Error('Create session failed')
        }
        const session = sessionResult.value

        if (skillResult.status !== 'fulfilled' || !skillResult.value.ok) {
          throw new Error('Load skills failed')
        }
        const skillData = (await skillResult.value.json()) as SkillItem[]
        if (!alive) return

        setSessionId(session.id)
        setSkills(skillData)

        const history = await listChatMessages(session.id)
        if (!alive) return
        setMessages(history)
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
    if (!activeSessionId) {
      try {
        const session = await createChatSession('对话')
        activeSessionId = session.id
        setSessionId(session.id)
      } catch (error) {
        setStatus('error')
        return
      }
    }
    const content = draft.trim()
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

  if (!token) {
    return (
      <section className="page-card">
        <h2 className="page-title">Chat</h2>
        <p className="page-subtitle">请先登录以同步技能与对话。</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate('/login')}>
          去登录
        </Button>
      </section>
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="page-card flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="page-title">对话</h2>
            <p className="page-subtitle">在对话中调用技能，气泡仅展示 tag，SKILL 原文由系统注入。</p>
          </div>
          <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" />
            选择技能
          </Button>
        </div>

        <ScrollArea className="h-[420px] rounded-2xl border border-border/70 bg-white p-4">
          <div className="flex flex-col gap-4">
            {messages.length === 0 && status === 'ready' && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
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
                      ? 'self-start rounded-2xl bg-muted/70 p-4 shadow-sm'
                      : 'self-end rounded-2xl bg-foreground text-background p-4 shadow-sm'
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

        <div className="rounded-2xl border border-border/70 bg-white p-4">
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
      </div>

      <aside className="flex flex-col gap-4">
        <div className="page-card-soft">
          <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">实时提示</h3>
          <p className="mt-3 text-base font-semibold">技能建议</p>
          <p className="mt-2 text-sm text-muted-foreground">
            选择技能后，可触发一次建议生成（同会话拒绝后不再提示）。
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={requestSuggestion}
            disabled={!selectedSkill || suggestionStatus === 'loading'}
          >
            {suggestionStatus === 'loading' ? '生成中...' : '触发建议'}
          </Button>
          {suggestionStatus === 'success' && (
            <p className="mt-3 text-xs text-emerald-600">已生成建议</p>
          )}
          {suggestionStatus === 'error' && (
            <p className="mt-3 text-xs text-destructive">生成失败，请稍后重试</p>
          )}
        </div>

        <div className="page-card-soft">
          <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">技能库快照</h3>
          <div className="mt-4 space-y-3">
            {skills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-3 text-xs text-muted-foreground">
                暂无可用技能
              </div>
            ) : (
              skills.slice(0, 4).map((skill) => (
                <div key={skill.id} className="rounded-2xl border border-border/70 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{skill.name}</p>
                    <Badge variant="secondary">{skill.tags[0] ?? '通用'}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{skill.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

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
