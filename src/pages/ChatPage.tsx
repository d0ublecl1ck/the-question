import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Tag, Wand2 } from 'lucide-react'

type Skill = {
  id: string
  name: string
  description: string
  tags: string[]
  cue: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  skills?: Skill[]
}

const skills: Skill[] = [
  {
    id: 'skill-brief',
    name: '需求澄清',
    description: '把模糊诉求拆成明确的目标、约束与下一步。',
    tags: ['对齐目标', '澄清'],
    cue: '用于梳理需求或确认验收标准。',
  },
  {
    id: 'skill-flow',
    name: '流程复盘',
    description: '复盘对话并产出可复用的流程摘要。',
    tags: ['复用', '流程'],
    cue: '用于把重复对话沉淀成流程。',
  },
  {
    id: 'skill-market',
    name: '技能推荐',
    description: '从技能市场中筛出最匹配的候选。',
    tags: ['检索', '市场'],
    cue: '当用户不确定要用哪个技能。',
  },
  {
    id: 'skill-tone',
    name: '语气校准',
    description: '匹配用户偏好的语气、长度与格式。',
    tags: ['偏好', '风格'],
    cue: '用于输出风格与格式一致性。',
  },
]

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: '已识别到你在反复整理需求，我可以帮你把它固化成技能流程。',
    skills: [skills[0]],
  },
  {
    id: 'msg-2',
    role: 'user',
    content: '好的，我想要一个可以复用的澄清模板。',
  },
]

export default function ChatPage() {
  const [open, setOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(skills[0])
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const skillById = Object.fromEntries(skills.map((skill) => [skill.id, skill]))

  const handleSend = () => {
    if (!draft.trim()) return
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: draft,
      skills: selectedSkill ? [selectedSkill] : undefined,
    }
    setMessages((prev) => [...prev, message])
    setDraft('')
    setSelectedSkill(null)
  }

  const handlePick = (skill: Skill) => {
    setSelectedSkill(skill)
    setOpen(false)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card/70 p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Chat</h2>
            <p className="text-sm text-muted-foreground">
              在对话中调用技能，气泡仅展示 tag，SKILL 原文由系统注入。
            </p>
          </div>
          <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" />
            选择技能
          </Button>
        </div>

        <ScrollArea className="h-[420px] rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'assistant'
                    ? 'self-start rounded-2xl bg-muted/80 p-4 shadow-sm'
                    : 'self-end rounded-2xl bg-foreground text-background p-4 shadow-sm'
                }
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.skills && message.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant={message.role === 'assistant' ? 'secondary' : 'outline'}
                        className={message.role === 'assistant' ? '' : 'border-white/40 text-white'}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
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
            <Button className="gap-2" onClick={handleSend}>
              <Wand2 className="h-4 w-4" />
              发送
            </Button>
          </div>
          <Textarea
            className="mt-3 min-h-[110px]"
            placeholder="输入内容，按 $ 触发技能选择"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === '$') {
                event.preventDefault()
                setOpen(true)
              }
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                handleSend()
              }
            }}
          />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl border border-border bg-card/80 p-5">
          <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">实时提示</h3>
          <p className="mt-3 text-base font-semibold">检测到重复意图</p>
          <p className="mt-2 text-sm text-muted-foreground">
            系统建议将“需求澄清”固化为技能流程，下次可一键复用。
          </p>
          <Button variant="outline" className="mt-4 w-full">
            创建新技能
          </Button>
        </div>

        <div className="rounded-3xl border border-border bg-card/70 p-5">
          <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">技能库快照</h3>
          <div className="mt-4 space-y-3">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <Badge variant="muted">{skill.tags[0]}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{skill.cue}</p>
              </div>
            ))}
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
              <CommandGroup heading="推荐">
                {skills.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    value={`${skill.name} ${skill.description} ${skill.tags.join(' ')}`}
                    onSelect={() => handlePick(skillById[skill.id])}
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
