# Market Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现市场页与技能详情页前端（列表/表格切换、精选区块、搜索/筛选、评论/举报入口），与后端新 API 对齐。

**Architecture:** 在 `MarketPage` 与 `SkillDetailPage` 进行页面级整合；抽离 Market 视图与工具条组件；数据拉取集中在页面顶层，子组件通过 props 传递最小字段。使用 shadcn/ui 为基础组件，必要时自定义轻量 UI。

**Tech Stack:** React, Vite, Tailwind CSS, shadcn/ui

### Task 1: 市场页结构与工具条（列表/表格切换 + 精选区块）

**Files:**
- Modify: `src/pages/MarketPage.tsx`
- Create: `src/components/market/MarketToolbar.tsx`
- Create: `src/components/market/MarketFeatured.tsx`
- Create: `src/components/market/MarketList.tsx`
- Create: `src/components/market/MarketTable.tsx`

**Step 1: Write the failing test**

Create `src/pages/MarketPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import MarketPage from './MarketPage'

test('renders market page sections', () => {
  render(<MarketPage />)
  expect(screen.getByText('市场')).toBeInTheDocument()
  expect(screen.getByText('官方精选')).toBeInTheDocument()
  expect(screen.getByText('全部技能')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: FAIL (missing test setup / sections).

**Step 3: Write minimal implementation**

Implement `MarketPage` with sections and view toggle state; add toolbar + featured + list/table components.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/MarketPage.tsx src/components/market/MarketToolbar.tsx src/components/market/MarketFeatured.tsx src/components/market/MarketList.tsx src/components/market/MarketTable.tsx src/pages/MarketPage.test.tsx
 git commit -m "feat(market-ui): add market layout and view toggle"
```

### Task 2: 市场列表/详情数据联通

**Files:**
- Create: `src/services/market.ts`
- Modify: `src/pages/MarketPage.tsx`
- Modify: `src/pages/SkillDetailPage.tsx`

**Step 1: Write the failing test**

Extend `src/pages/MarketPage.test.tsx`:
```tsx
import { vi } from 'vitest'
import * as marketApi from '../services/market'

vi.spyOn(marketApi, 'fetchMarketSkills').mockResolvedValue([])

test('loads market skills', async () => {
  render(<MarketPage />)
  expect(await screen.findByText('暂无技能')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: FAIL (service missing).

**Step 3: Write minimal implementation**

Create service:
```ts
export async function fetchMarketSkills() {
  const res = await fetch('/api/v1/market/skills')
  if (!res.ok) throw new Error('load failed')
  return res.json()
}
```

Update MarketPage to load and render empty state; update SkillDetailPage to fetch `/api/v1/market/skills/{id}` and display header fields.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/market.ts src/pages/MarketPage.tsx src/pages/SkillDetailPage.tsx src/pages/MarketPage.test.tsx
 git commit -m "feat(market-ui): wire market list and detail data"
```

### Task 3: 搜索/筛选/排序交互与空态

**Files:**
- Modify: `src/pages/MarketPage.tsx`
- Modify: `src/components/market/MarketToolbar.tsx`

**Step 1: Write the failing test**

Add to `src/pages/MarketPage.test.tsx`:
```tsx
test('filters by search input', async () => {
  render(<MarketPage />)
  const input = screen.getByPlaceholderText('搜索技能')
  expect(input).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Implement search input, tags, and view toggle with local state; empty state when filtered list is empty.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/pages/MarketPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/MarketPage.tsx src/components/market/MarketToolbar.tsx src/pages/MarketPage.test.tsx
 git commit -m "feat(market-ui): add search filter and empty state"
```

### Task 4: 详情页评论区入口与举报入口

**Files:**
- Modify: `src/pages/SkillDetailPage.tsx`
- Create: `src/components/market/ReportDialog.tsx`

**Step 1: Write the failing test**

Create `src/pages/SkillDetailPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import SkillDetailPage from './SkillDetailPage'

test('renders report entry', () => {
  render(<SkillDetailPage />)
  expect(screen.getByText('举报')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/pages/SkillDetailPage.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Add report button and dialog; add comments section entry (placeholder with count) and wire to endpoints in later tasks.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/pages/SkillDetailPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/SkillDetailPage.tsx src/components/market/ReportDialog.tsx src/pages/SkillDetailPage.test.tsx
 git commit -m "feat(market-ui): add report entry on detail page"
```

---

Plan complete and saved to `docs/plans/2026-01-17-market-frontend-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration

2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
