# RTK Query Store Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all frontend API calls to Redux Toolkit + RTK Query so pages only subscribe to store data.

**Architecture:** Introduce a single Redux store with RTK Query API slice(s), migrate auth/toast to slices, replace page-level fetch/useEffect with RTK Query hooks, and centralize auth/error handling in baseQuery.

**Tech Stack:** React, Redux Toolkit, RTK Query, React Router, Vitest.

---

### Task 1: Add Redux Toolkit + RTK Query store scaffold

**Files:**
- Create: `src/store/index.ts`
- Create: `src/store/rootReducer.ts`
- Create: `src/store/appStore.ts`
- Create: `src/store/api/baseApi.ts`
- Create: `src/store/api/types.ts`
- Modify: `src/main.tsx`
- Test: `src/__tests__/providers.test.tsx`

**Step 1: Write the failing test**

Add a test to ensure App renders with Redux Provider and RTK Query middleware is wired (smoke-level).

```tsx
// src/__tests__/providers.test.tsx
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '@/store/appStore'
import App from '@/App'

test('renders app with redux provider', () => {
  const { getByText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  )
  expect(getByText('WenDui')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/providers.test.tsx -r`
Expected: FAIL because `@/store/appStore` does not exist.

**Step 3: Write minimal implementation**

Create store files:

```ts
// src/store/appStore.ts
import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from './rootReducer'
import { baseApi } from './api/baseApi'

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

```ts
// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
})
```

```ts
// src/store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
})
```

```ts
// src/store/index.ts
export * from './appStore'
```

Update entry:

```tsx
// src/main.tsx
import { Provider } from 'react-redux'
import { store } from '@/store/appStore'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/providers.test.tsx -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store src/main.tsx src/__tests__/providers.test.tsx
git commit -m "feat(store): add redux toolkit scaffold"
```

---

### Task 2: Migrate auth/toast to Redux slices + persistence

**Files:**
- Create: `src/store/slices/authSlice.ts`
- Create: `src/store/slices/toastSlice.ts`
- Create: `src/store/hooks.ts`
- Modify: `src/store/rootReducer.ts`
- Modify: `src/components/ui/toast` (if needed) or toast usage sites
- Modify: `src/stores/authStore.ts` (deprecate or remove usage)
- Modify: `src/stores/toastStore.ts` (deprecate or remove usage)
- Test: `src/stores/__tests__/authStore.test.ts` (replace with slice tests)

**Step 1: Write the failing test**

Add tests for auth slice persistence and clear behavior:

```ts
// src/store/__tests__/authSlice.test.ts
import { authReducer, setAuth, clearAuth } from '@/store/slices/authSlice'

test('sets authenticated state with token and user', () => {
  const state = authReducer(undefined, setAuth({
    token: 't',
    user: { id: '1', email: 'a@b.com' },
  }))
  expect(state.status).toBe('authenticated')
  expect(state.token).toBe('t')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/store/__tests__/authSlice.test.ts -r`
Expected: FAIL (missing module).

**Step 3: Write minimal implementation**

Implement slice with localStorage read/write in module-level helpers, and expose actions/selectors. Add toast slice with push/remove. Remove Zustand usage from app.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/store/__tests__/authSlice.test.ts -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store src/stores src/store/__tests__
git commit -m "feat(store): migrate auth and toast to slices"
```

---

### Task 3: Add RTK Query endpoints (market/search/settings/auth/chat/ai)

**Files:**
- Create: `src/store/api/marketApi.ts`
- Create: `src/store/api/searchApi.ts`
- Create: `src/store/api/settingsApi.ts`
- Create: `src/store/api/authApi.ts`
- Create: `src/store/api/chatApi.ts`
- Create: `src/store/api/aiApi.ts`
- Modify: `src/store/api/baseApi.ts`
- Modify: `src/store/rootReducer.ts`
- Test: `src/api/__tests__/httpClient.test.ts` (replace or add RTK query tests)

**Step 1: Write the failing test**

Add a test that baseQuery injects auth header and handles 401 by dispatching clearAuth + toast:

```ts
// src/store/__tests__/baseApi.test.ts
import { store } from '@/store/appStore'
import { setAuth } from '@/store/slices/authSlice'
import { baseApi } from '@/store/api/baseApi'

// use a mock fetch implementation to assert headers and 401 handling
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/store/__tests__/baseApi.test.ts -r`
Expected: FAIL (baseApi lacks auth/401 handling).

**Step 3: Write minimal implementation**

Implement `baseQuery` wrapper with:
- token from `authSlice`
- 401 handling: dispatch `clearAuth`, toast, redirect
- global error toast for non-401

Add endpoints:
- Market: list, detail, favorites, report
- Search: search skills
- Settings: get me, get memory, update me, update memory
- Auth: login, register, fetch me
- Chat: create session, list messages, create message, create suggestion
- AI: list models

**Step 4: Run test to verify it passes**

Run: `pnpm test src/store/__tests__/baseApi.test.ts -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store src/store/__tests__
git commit -m "feat(api): add rtk query endpoints and baseQuery auth"
```

---

### Task 4: Migrate pages to RTK Query hooks (Market, Library, SkillDetail)

**Files:**
- Modify: `src/pages/MarketPage.tsx`
- Modify: `src/pages/LibraryPage.tsx`
- Modify: `src/pages/SkillDetailPage.tsx`
- Modify: `src/pages/MarketPage.test.tsx`
- Modify: `src/pages/LibraryPage.test.tsx`
- Modify: `src/pages/SkillDetailPage.test.tsx`

**Step 1: Write the failing test**

Update tests to mock RTK Query hooks instead of services; assert that loading/error states map to query state.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/MarketPage.test.tsx -r`
Expected: FAIL (hooks not wired).

**Step 3: Write minimal implementation**

Replace useEffect/useState with RTK Query hooks and `selectFromResult` for derived data.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/MarketPage.test.tsx -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages src/pages/*.test.tsx
git commit -m "refactor(pages): migrate market library detail to rtk query"
```

---

### Task 5: Migrate pages to RTK Query hooks (Chat, Settings, Search, Login)

**Files:**
- Modify: `src/pages/ChatPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/SearchPage.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/ChatPage.test.tsx`
- Modify: `src/pages/SettingsPage.test.tsx`
- Modify: `src/pages/SearchPage.test.tsx`
- Modify: `src/pages/LoginPage.test.tsx`

**Step 1: Write the failing test**

Update tests to use RTK Query hook mocks (or MSW) for query/mutation state. Ensure ChatPage handles loading, success, and error when session/model/skills queries fail.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/ChatPage.test.tsx -r`
Expected: FAIL (hooks not wired).

**Step 3: Write minimal implementation**

- Chat: use `useCreateChatSessionMutation`, `useGetChatMessagesQuery`, `useGetSkillsQuery`, `useListAiModelsQuery`; keep stream handling local and update cached messages via `updateQueryData`.
- Settings: replace `authFetch` with queries/mutations; invalidatesTags on save.
- Search: use `useLazySearchSkillsQuery` for submit.
- Login: use `useLoginMutation`, `useRegisterMutation`, `useMeQuery` with manual trigger; set auth slice on success.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/ChatPage.test.tsx -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages src/pages/*.test.tsx
git commit -m "refactor(pages): migrate chat settings search login to rtk query"
```

---

### Task 6: Remove legacy services and Zustand stores

**Files:**
- Remove: `src/services/*.ts` (if fully migrated)
- Remove: `src/stores/authStore.ts`
- Remove: `src/stores/toastStore.ts`
- Modify: `src/components/market/ReportDialog.tsx`
- Modify: `src/api/__tests__/httpClient.test.ts` (if no longer relevant)
- Test: `pnpm test`

**Step 1: Write the failing test**

Add a test that ensures ReportDialog uses mutation hook and shows success state based on mutation result.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/components/market/ReportDialog.test.tsx -r`
Expected: FAIL (component still uses fetch).

**Step 3: Write minimal implementation**

Swap ReportDialog to `useCreateReportMutation` and remove `fetch` usage.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/components/market/ReportDialog.test.tsx -r`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services src/stores src/components

git commit -m "refactor: remove legacy services and zustand stores"
```

---

### Task 7: Full test + lint verification

**Files:**
- N/A

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 2: Run lint (if configured)**

Run: `pnpm lint`
Expected: PASS

**Step 3: Commit (if needed)**

```bash
git add -A
git commit -m "chore: finalize rtk query migration"
```

---

## Notes

- Follow RTK Query best practices: `selectFromResult`, `skip`, `refetchOnFocus` defaults.
- Avoid request waterfalls by parallelizing independent queries.
- Use mutations for write actions; prefer `invalidatesTags` over manual refetch.
- Streaming AI remains manual fetch but should update RTK Query cache via `updateQueryData`.

