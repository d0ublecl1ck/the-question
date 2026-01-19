import ChatBubble from '@/components/chat/ChatBubble'
import { Conversation, ConversationContent } from '@/components/ui/conversation'
import { Message } from '@/components/ui/message'
import { useTranslation } from 'react-i18next'
import { registerTranslations } from '@/lib/i18n'

registerTranslations('bubbleDemo', {
  zh: {
    header: {
      title: '气泡演示',
      description: '纯静态展示，覆盖当前所有气泡组合与 Markdown 渲染。',
    },
    demoBubbles: [
      {
        id: 'assistant-plain',
        role: 'assistant',
        content: '这是一个普通的助手气泡，用于回答问题或提供建议。',
        name: 'AI',
      },
      {
        id: 'assistant-skill',
        role: 'assistant',
        content: '这是一个带技能标签的助手气泡，用于表明建议来源的技能。',
        name: 'AI',
        skillName: '需求澄清',
      },
      {
        id: 'assistant-image-inline',
        role: 'assistant',
        content:
          '这是一个图文混排的助手气泡：\\n![preview](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/aaZ0iQAAAAASUVORK5CYII=)\\n图片可以出现在文本任意位置。',
        name: 'AI',
      },
      {
        id: 'assistant-markdown',
        role: 'assistant',
        content: `# Markdown 支持

- **强调**：用粗体突出重点
- \`inline\` 代码与 [链接](https://example.com)
- ~~删除线~~ 与多行换行

> 引用可以承载提示语
> 并保留换行节奏

\`\`\`ts
const total = 3 + 5
console.log(total)
\`\`\`

| 字段 | 值 |
| --- | --- |
| 状态 | OK |
| 耗时 | 120ms |
`,
        name: 'AI',
      },
      {
        id: 'assistant-long',
        role: 'assistant',
        content:
          '这是一个长内容的助手气泡示例，用于展示多行文本与更长段落在布局中的表现。建议信息可以写在气泡里，避免额外的操作条。',
        name: 'AI',
      },
      {
        id: 'assistant-clarify-chain',
        role: 'assistant',
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
        role: 'user',
        content: '这是一个普通的用户气泡，用于展示用户发送的内容。',
        name: 'ME',
      },
      {
        id: 'user-skill',
        role: 'user',
        content: '这是一个带技能标签的用户气泡，通常用于标识提问时选择的技能。',
        skillName: '写作助手',
        name: 'ME',
      },
      {
        id: 'user-markdown',
        role: 'user',
        content: '用户也可以发送 Markdown，比如 `code` 与 **强调**。',
        name: 'ME',
      },
      {
        id: 'user-long',
        role: 'user',
        content:
          '这是一个长内容的用户气泡示例，用于展示长段输入时的对齐与排版效果。文字较多时也要保持清晰的阅读节奏。',
        name: 'ME',
      },
    ],
  },
  en: {
    header: {
      title: 'Bubble demo',
      description: 'Static showcase covering all current bubble combinations and Markdown rendering.',
    },
    demoBubbles: [
      {
        id: 'assistant-plain',
        role: 'assistant',
        content: 'This is a plain assistant bubble for answers or suggestions.',
        name: 'AI',
      },
      {
        id: 'assistant-skill',
        role: 'assistant',
        content: 'An assistant bubble with a skill tag to show where advice comes from.',
        name: 'AI',
        skillName: 'Requirement clarification',
      },
      {
        id: 'assistant-image-inline',
        role: 'assistant',
        content:
          'This is an assistant bubble with mixed text and image:\\n![preview](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/aaZ0iQAAAAASUVORK5CYII=)\\nImages can appear anywhere in the text.',
        name: 'AI',
      },
      {
        id: 'assistant-markdown',
        role: 'assistant',
        content: `# Markdown support

- **Emphasis**: use bold to highlight
- \`inline\` code and [links](https://example.com)
- ~~Strikethrough~~ and line breaks

> Quotes can carry hints
> while keeping line breaks

\`\`\`ts
const total = 3 + 5
console.log(total)
\`\`\`

| Field | Value |
| --- | --- |
| Status | OK |
| Duration | 120ms |
`,
        name: 'AI',
      },
      {
        id: 'assistant-long',
        role: 'assistant',
        content:
          'This long-form assistant bubble shows how multi-line paragraphs look in the layout. Tips can live inside the bubble without extra action bars.',
        name: 'AI',
      },
      {
        id: 'assistant-clarify-chain',
        role: 'assistant',
        content: `<!-- Clarification chain -->
\`\`\`json
{
  "clarify_chain": [
    {
      "type": "single_choice",
      "question": "Are you buying bananas to eat today?",
      "choices": ["Yes", "No", "Other"]
    },
    {
      "type": "ranking",
      "question": "Rank by importance:",
      "options": ["Sweeter, softer texture", "Keeps longer / less likely to overripen", "Looks good with fewer spots", "Better value / cheaper"]
    },
    {
      "type": "free_text",
      "question": "Extra details (how many, when you’ll finish them, eat directly or make smoothies/baking, where to buy: supermarket/farmers market)?"
    }
  ]
}
\`\`\``,
        name: 'AI',
      },
      {
        id: 'user-plain',
        role: 'user',
        content: 'This is a plain user bubble showing user messages.',
        name: 'ME',
      },
      {
        id: 'user-skill',
        role: 'user',
        content: 'A user bubble with a skill tag, usually showing the selected skill.',
        skillName: 'Writing assistant',
        name: 'ME',
      },
      {
        id: 'user-markdown',
        role: 'user',
        content: 'Users can send Markdown too, like `code` and **emphasis**.',
        name: 'ME',
      },
      {
        id: 'user-long',
        role: 'user',
        content:
          'This long-form user bubble shows alignment and typography for longer inputs. Even long text should stay readable.',
        name: 'ME',
      },
    ],
  },
})

export default function BubbleDemoPage() {
  const { t } = useTranslation('bubbleDemo')
  const demoBubbles = t('demoBubbles', { returnObjects: true }) as Array<{
    id: string
    role: 'assistant' | 'user'
    content: string
    name: string
    skillName?: string
  }>
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[28px] border border-border/60 bg-white/80 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">WenDui</p>
        <h1 className="text-2xl font-semibold text-foreground">{t('header.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('header.description')}</p>
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
