import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { AI_Prompt, type AiModelOption } from '@/components/ui/animated-ai-input'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onTriggerSkill: () => void
  models: AiModelOption[]
  selectedModelId: string | null
  onModelChange: (modelId: string) => void
  disabled?: boolean
  selectedSkillName?: string | null
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onTriggerSkill,
  models,
  selectedModelId,
  onModelChange,
  disabled,
  selectedSkillName,
}: ChatComposerProps) {
  return (
    <div className="mt-6">
      <div className="mx-auto w-full">
        <div className="flex flex-wrap items-center gap-2">
        {selectedSkillName && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {selectedSkillName}
          </Badge>
        )}
        </div>
        <AI_Prompt
          value={value}
          onChange={onChange}
          onSend={onSend}
          onTriggerSkill={onTriggerSkill}
          models={models}
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
