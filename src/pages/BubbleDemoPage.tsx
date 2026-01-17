import ChatBubble from '@/components/chat/ChatBubble'
import { Conversation, ConversationContent } from '@/components/ui/conversation'
import { Message } from '@/components/ui/message'

const demoBubbles = [
  {
    id: 'assistant-plain',
    role: 'assistant' as const,
    content: '这是一个普通的助手气泡，用于回答问题或提供建议。',
    name: 'AI',
  },
  {
    id: 'assistant-skill',
    role: 'assistant' as const,
    content: '这是一个带技能标签的助手气泡，用于表明建议来源的技能。',
    name: 'AI',
    skillName: '需求澄清',
  },
  {
    id: 'assistant-image-inline',
    role: 'assistant' as const,
    content:
      '这是一个图文混排的助手气泡：\n![preview](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/aaZ0iQAAAAASUVORK5CYII=)\n图片可以出现在文本任意位置。',
    name: 'AI',
  },
  {
    id: 'assistant-long',
    role: 'assistant' as const,
    content:
      '这是一个长内容的助手气泡示例，用于展示多行文本与更长段落在布局中的表现。建议信息可以写在气泡里，避免额外的操作条。',
    name: 'AI',
  },
  {
    id: 'assistant-clarify-chain',
    role: 'assistant' as const,
    content: `<!-- Clarification chain -->
\`\`\`json
{
  "clarify_chain": [
    {
      "type": "single_choice",
      "question": "你买香蕉是要今天就吃吗？",
      "choices": ["是", "否", "其他"]
    },
    {
      "type": "ranking",
      "question": "请按重要性排序：",
      "options": ["更甜更软口感", "耐放不易熟过头", "外观好看少斑点", "性价比/更便宜"]
    },
    {
      "type": "free_text",
      "question": "补充说明（打算买多少、预计几天内吃完、是直接吃还是做奶昔/烘焙、在哪买：超市/菜市场）？"
    }
  ]
}
\`\`\``,
    name: 'AI',
  },
  {
    id: 'user-plain',
    role: 'user' as const,
    content: '这是一个普通的用户气泡，用于展示用户发送的内容。',
    name: 'ME',
  },
  {
    id: 'user-skill',
    role: 'user' as const,
    content: '这是一个带技能标签的用户气泡，通常用于标识提问时选择的技能。',
    skillName: '写作助手',
    name: 'ME',
  },
  {
    id: 'user-long',
    role: 'user' as const,
    content:
      '这是一个长内容的用户气泡示例，用于展示长段输入时的对齐与排版效果。文字较多时也要保持清晰的阅读节奏。',
    name: 'ME',
  },
]

export default function BubbleDemoPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[28px] border border-border/60 bg-white/80 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">WenDui</p>
        <h1 className="text-2xl font-semibold text-foreground">Bubble Demo</h1>
        <p className="text-sm text-muted-foreground">纯静态展示，覆盖当前所有气泡组合。</p>
      </header>
      <Conversation className="">
        <ConversationContent className="flex flex-col gap-4">
          {demoBubbles.map((bubble) => (
            <Message key={bubble.id} from={bubble.role}>
              <ChatBubble role={bubble.role} content={bubble.content} skillName={bubble.skillName} />
            </Message>
          ))}
        </ConversationContent>
      </Conversation>
    </section>
  )
}
