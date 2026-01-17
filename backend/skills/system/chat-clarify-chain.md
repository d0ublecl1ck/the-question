---
name: chat-clarify-chain
description: Use to turn vague, short, contradictory, or missing-key-detail user prompts into a structured clarification chain for chatbot conversations. Trigger when the user’s intent is unclear, constraints are missing, or the request cannot be executed without additional specifics. Output a JSON clarification chain (choice + ranking + free-text) that guides the user to answer, then iterate until the intent is sufficiently clear.
---

# Chat Clarify Chain

## Overview

Generate a compact clarification chain that guides users from low-quality prompts to a clear, actionable request. Focus on asking only the minimum set of high-leverage questions, then stop once the intent is sufficiently clear.

## Workflow

### Step 0: Decide Whether to Trigger
- Trigger when the prompt is too short, vague, contradictory, or missing key details needed to proceed.
- Do not trigger if the user’s intent is already clear enough to deliver a reasonable first response.

### Step 1: Identify the Missing Criticals
Identify the smallest set of missing information that blocks progress. Common categories:
- Objective: What outcome they want.
- Scope: What exactly is included/excluded.
- Constraints: Time, budget, format, platform, brand, etc.
- Preferences: Style, priority, trade-offs.
- Required vs optional: Confirm what must be satisfied versus nice-to-have.

### Step 2: Emit a JSON Clarification Chain (Fixed Schema)
Always output a JSON object that contains a short multi-question chain. Start the response with the marker `<!-- Clarification chain -->` on the first line, then output only the JSON (no extra text).
- One single-choice question with options ["是", "否", "其他"].
- One ranking question for priorities or preferences.
- One free-text question for missing details.

Use this schema (do not add extra top-level keys):

```json
{
  "clarify_chain": [
    {
      "type": "single_choice",
      "question": "...",
      "choices": ["是", "否", "其他"]
    },
    {
      "type": "ranking",
      "question": "...",
      "options": ["A", "B", "C"]
    },
    {
      "type": "free_text",
      "question": "补充说明"
    }
  ]
}
```

### Step 3: Iterate with User Answers
- When the user answers, refine the chain to the next smallest missing set.
- Stop the chain once the request is “sufficiently clear” to proceed.
- Keep each chain concise (max 3 questions per turn).

## Question Design Rules

- Use concrete options in ranking (not abstract labels), e.g., “越野性能 / 乘坐舒适 / 油耗 / 价格”.
- Single-choice question should verify “必填 vs 选填” or a binary constraint, with “其他” as escape hatch.
- Free-text question should be short and tightly scoped to the most critical missing detail.
- All questions should be explicit interrogative sentences (end with “？”).
- Avoid asking for everything at once; keep the chain minimal.

## Example Triggers

Use these as examples of “low-quality prompts” that should trigger the chain:
- “我想选越野车”
- “帮我写个东西”
- “做个页面”
- “优化一下”
- “这个怎么弄”

## Example Output

User prompt: “我想选越野车”

```json
{
  "clarify_chain": [
    {
      "type": "single_choice",
      "question": "预算是硬性约束吗？",
      "choices": ["是", "否", "其他"]
    },
    {
      "type": "ranking",
      "question": "请按重要性排序：",
      "options": ["越野性能", "乘坐舒适", "油耗", "价格"]
    },
    {
      "type": "free_text",
      "question": "补充说明（例如预算区间、使用场景、品牌偏好）？"
    }
  ]
}
```

Stop asking once the user provides enough detail to recommend concrete options.
