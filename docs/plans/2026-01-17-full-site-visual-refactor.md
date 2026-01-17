# Full Site Visual Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 按参考图统一全站视觉风格，重构所有页面与外壳布局，保持真实数据流与交互不变。

**Architecture:** 通过全局样式与 AppShell 统一基调（字体、色彩、圆角、背景），再逐页调整布局与卡片组件，保证视觉一致与交互清晰。尽量复用现有组件并减少重复样式。

**Tech Stack:** React, Vite, Tailwind CSS, shadcn/ui

### Task 1: 全局视觉基调（字体/背景/卡片风格）

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/AppShell.tsx`

**Step 1: Write the failing test**

N/A（样式改造）。

**Step 2: Implement minimal base styling**

- 在 `src/index.css` 加入字体与背景渐变；统一圆角、阴影、卡片风格的基础类。
- 在 `AppShell` 侧栏与顶部栏应用新的背景、边框与卡片风格。

**Step 3: Manual verify**

Run: `pnpm dev` 打开页面检查整体风格是否接近参考图。

**Step 4: Commit**

```bash
git add src/index.css src/components/AppShell.tsx
 git commit -m "style(ui): refresh global theme and shell"
```

### Task 2: 认证与空页（Login/NotFound）

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/NotFoundPage.tsx`

**Step 1: Update layout & typography**

- 大卡片 + 细边框 + 柔和背景；按钮使用椭圆风格。

**Step 2: Run tests**

Run: `pnpm test -- --run src/pages/LoginPage.test.tsx src/pages/NotFoundPage.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/NotFoundPage.tsx
 git commit -m "style(auth): align login and 404 pages"
```

### Task 3: 核心页面（Chat/Market/Search/Library/Settings/Detail）

**Files:**
- Modify: `src/pages/ChatPage.tsx`
- Modify: `src/pages/MarketPage.tsx`
- Modify: `src/pages/SearchPage.tsx`
- Modify: `src/pages/LibraryPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/SkillDetailPage.tsx`
- Modify: `src/components/market/*`

**Step 1: Adjust layouts**

- 页面头部统一：小标题 + 大标题 + 描述
- 卡片使用大圆角 + 轻渐变背景 + 微阴影
- 列表/表格/工具条统一视觉

**Step 2: Run tests**

Run: `pnpm test -- --run src/pages/ChatPage.test.tsx src/pages/MarketPage.test.tsx src/pages/SearchPage.test.tsx src/pages/LibraryPage.test.tsx src/pages/SettingsPage.test.tsx src/pages/SkillDetailPage.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages src/components/market
 git commit -m "style(app): refactor core pages to new visual system"
```

---

Plan complete and saved to `docs/plans/2026-01-17-full-site-visual-refactor.md`.
