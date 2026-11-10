# Skeleton Page Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render in-app navigation immediately and show layout-matched shadcn-vue skeletons while server data resolves.

**Architecture:** Keep SSR blocking so the first HTML is complete. On client navigation, middleware starts fetches without awaiting; pages render from `useState` caches and subscribe to per-key status (pending/error/hydrated). Skeletons appear after 150 ms of pending state, cached data is used for 30 seconds before a silent revalidation, and 404s for detail pages wait until hydration.

**Tech Stack:** Nuxt 4 (app/ srcDir), Vue 3.5, `useState` caches, shadcn-vue `Skeleton`/`Empty`, Tailwind CSS 4, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-09-skeleton-page-transition-design.md`

## Global Constraints

- Use the installed shadcn-vue `Skeleton` from `@/components/ui/skeleton`. Do not add a new primitive and do not write `animate-pulse` divs by hand.
- Do not edit `app/components/ui/**` other than importing its exports.
- Use semantic tokens only (`bg-primary/10` comes from Skeleton; page-level classes keep `text-headline`, `text-subline`, `bg-card`, `border-line`).
- Icons import from `@lucide/vue`.
- Components under `app/components/skeletons/` auto-import with the `Skeletons` prefix (`<SkeletonsTableSkeleton>`, `<SkeletonsContentError>`, and so on). Short names later in this plan refer to those auto-imported components.
- SSR must keep awaiting data: skeletons are client-navigation only and must never render during SSR.
- Skeleton threshold: 150 ms. Content fade: 120 ms. Cache TTL: 30 seconds.
- Detail-page 404 fires only after the relevant cache key is hydrated; on SSR the awaited data keeps the current error path.
- There is no test script or test suite in this repo. Verification is `pnpm typecheck`, `pnpm lint`, `pnpm build`, plus the manual checks listed per task.
- Conventional Commits.
- Match existing file style: 2-space indent, no Prettier, comments only where they add information.

## Review Focus

1. Cold client navigation to `/workspaces/:slug` with an empty workspace cache must render the shell and skeleton, and must not 404 the valid slug.
2. Switching between two workspaces quickly must never show one workspace's tasks under the other's header.
3. An unknown task/material id with a warm cache must 404 immediately; a known id with a cold cache must show the skeleton first, not 404.
4. A direct SSR request to any detail URL must return complete HTML with no skeleton and no hydration mismatch.
5. A cold `/dashboard` navigation or a failed `/api/workspaces` must show a skeleton then an error with Retry, never the "No workspaces yet" empty state.

---

### Task 1: Cache status primitives

**Files:**
- Modify: `app/composables/apiCache.ts`
- Modify: `app/composables/useDataFetch.ts`

**Interfaces:**
- Consumes: existing `useWorkspaceCache`, `useTaskCache`, `useMaterialCache`, `useSettingsCache`, `useHydratedCache`, `setHydrated`.
- Produces:
  - `useLoadingCache(): Ref<Record<string, boolean>>`
  - `useErrorCache(): Ref<Record<string, string | null>>`
  - `useFetchedAtCache(): Ref<Record<string, number>>`
  - `markLoading(key: string, value: boolean, loading?: Ref<Record<string, boolean>>): void`
  - `setFetchError(key: string, message: string | null, errors?: Ref<Record<string, string | null>>): void`
  - `markFetched(key: string, at?: number, fetchedAt?: Ref<Record<string, number>>): void`
  - `isFresh(key: string, ttlMs?: number): boolean`
  - `fetchWorkspaceList(options?: { force?: boolean }): Promise<Workspace[]>`
  - `fetchWorkspaceData(slug: string, options?: { force?: boolean }): Promise<void>`
  - `fetchSettings(options?: { force?: boolean }): Promise<AppSettings | null>`

- [ ] **Step 1: Add the three status caches and helpers to `app/composables/apiCache.ts`**

State keys: `api-loading`, `api-errors`, `api-fetched-at`. Follow the existing pattern where each helper calls `useState` and the `mark*` helpers accept an optional captured ref so callers can pass the ref they captured before an `await`.

`isFresh` reads `useFetchedAtCache()` and compares against `Date.now() - ttlMs`, default `30_000`.

- [ ] **Step 2: Rewrite `fetchWorkspaceList` in `app/composables/useDataFetch.ts`**

Signature as above. Behavior, in order:
1. Capture `workspaces`, `hydrated`, `loading`, `errors` refs before any `await`.
2. Return `workspaces.value` when `!options?.force && isFresh('workspaces')`.
3. Return `workspaces.value` when `!options?.force && loading.value['workspaces']` is true.
4. `markLoading('workspaces', true, loading)` and `setFetchError('workspaces', null, errors)`.
5. `try` the request; on success assign `workspaces.value`, `setHydrated('workspaces', hydrated)`, `markFetched('workspaces')`.
6. `catch` records `setFetchError('workspaces', 'Could not load workspaces.', errors)` and leaves the existing cache.
7. `finally` clears loading.

- [ ] **Step 3: Rewrite `fetchWorkspaceData` with the same guards**

Key is `workspace:${ws.id}`. Order:
1. Capture refs and `isFresh(key)` / `loading.value[key]` checks before awaiting.
2. If the workspace list is stale and empty, call `fetchWorkspaceList()` first (still awaited here, because the list is needed to resolve the slug).
3. If the workspace is absent, return without error.
4. Fetch tasks and materials in `Promise.all`, each `.catch` recording the key error instead of silently returning an empty list.
5. Merge per workspace: `tasks.value = [...tasks.value.filter(t => t.workspaceId !== ws.id), ...ts]` (same for materials).
6. Only call `setHydrated(key)`, `markFetched(key)` when both requests succeeded; otherwise call `setFetchError(key, 'Could not load this workspace.')`.
7. Clear loading in `finally`.

- [ ] **Step 4: Add the same `force`/fresh/in-flight guards to `fetchSettings`**

Key `settings`. Keep mirroring into the `app-settings` UI state. On failure, record the error and keep the existing settings value.

- [ ] **Step 5: Verify types**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/composables/apiCache.ts app/composables/useDataFetch.ts
git commit -m "feat(cache): track loading, errors, and freshness per data key"
```

---

### Task 2: Pending-state composable

**Files:**
- Create: `app/composables/useDataStatus.ts`

**Interfaces:**
- Consumes: `useHydratedCache`, `useLoadingCache`, `useErrorCache`.
- Produces:
  ```ts
  export function useDataStatus(key: MaybeRefOrGetter<string>): {
    ready: ComputedRef<boolean>
    pending: ComputedRef<boolean>
    showSkeleton: ComputedRef<boolean>
    error: ComputedRef<string | null>
  }
  ```

- [ ] **Step 1: Implement the composable**

Rules:
- `ready = hydrated[key] === true`.
- `pending = !ready && !error`.
- `showSkeleton` becomes true only after `pending` has stayed true for 150 ms; it becomes false immediately when `pending` becomes false.
- Use `watch` with a `setTimeout` and clear the timer on change and in `onScopeDispose`.
- Resolve `key` with `toValue` inside computed getters.

- [ ] **Step 2: Verify types**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useDataStatus.ts
git commit -m "feat(ui): add delayed pending-state composable"
```

---

### Task 3: Skeleton building blocks

**Files:**
- Create: `app/components/skeletons/PageHeaderSkeleton.vue`
- Create: `app/components/skeletons/TableSkeleton.vue`
- Create: `app/components/skeletons/DetailSkeleton.vue`
- Create: `app/components/skeletons/SidebarSkeleton.vue`
- Create: `app/components/skeletons/ContentError.vue`
- Modify: `app/assets/css/tailwind.css`

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/skeleton`, `Empty` parts from `@/components/ui/empty`, `Button` from `@/components/ui/button`.
- Produces (auto-imported as `SkeletonsPageHeaderSkeleton`, `SkeletonsTableSkeleton`, `SkeletonsDetailSkeleton`, `SkeletonsSidebarSkeleton`, `SkeletonsContentError`):
  - `PageHeaderSkeleton` props: `{ withAction?: boolean }`
  - `TableSkeleton` props: `{ rows?: number; barClass: string[] }`
  - `DetailSkeleton` props: none
  - `SidebarSkeleton` props: `{ lines?: number }`
  - `ContentError` props: `{ message: string; retryLabel?: string }`, emits `retry`

- [ ] **Step 1: `PageHeaderSkeleton.vue`**

Title bar `h-7 w-48` on desktop / `h-5 w-32` on mobile, optional action block `h-9 w-28 rounded-md`. Use `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`.

- [ ] **Step 2: `TableSkeleton.vue`**

Render a `Card` with `CardContent class="p-0"` and a `div` per row: `flex items-center gap-4 border-b border-line px-4 py-3 last:border-0`. For each entry in `barClass`, render `<Skeleton :class="entry" />`; the caller includes height and width plus any `hidden sm:block` in each string. Default `rows = 6`. Include a header row of shorter bars at `hidden sm:flex`.

Emit `aria-hidden="true"` on the wrapper.

- [ ] **Step 3: `DetailSkeleton.vue`**

Two-column layout matching the detail pages: `grid gap-6 lg:grid-cols-3`. Left column `lg:col-span-2` is a `Card` with three tall bars (`h-4 w-2/3`, `h-3 w-full`, `h-3 w-5/6`). Right column is a `flex flex-col gap-6` with three `Card`s of two bars each. Top: `h-8 w-64` title plus `h-4 w-40` subtitle.

- [ ] **Step 4: `SidebarSkeleton.vue`**

`lines` rows of `flex items-center gap-2 px-2 py-1.5`, each a `size-5 rounded` dot plus `h-3 flex-1` bar. Default `lines = 4`. `aria-hidden="true"`.

- [ ] **Step 5: `ContentError.vue`**

Use `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`. Title copy: `Couldn't load this page`. Description = `message` prop. Action = `Button variant="outline" size="sm"` with `RefreshCcw` icon and label from `retryLabel ?? 'Try again'`, emitting `retry`.

- [ ] **Step 6: Add the fade utility to `app/assets/css/tailwind.css`**

Append near the existing `@keyframes rise` block:

```css
@keyframes content-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.content-fade-in { animation: content-in .12s ease-out both; }

@media (prefers-reduced-motion: reduce) {
  .content-fade-in { animation: none; }
}
```

- [ ] **Step 7: Verify lint and types**

Run: `pnpm typecheck`
Expected: exit 0.
Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/components/skeletons app/assets/css/tailwind.css
git commit -m "feat(ui): add shadcn-vue skeleton building blocks"
```

---

### Task 4: Non-blocking navigation

**Files:**
- Modify: `app/middleware/data.global.ts`
- Modify: `app/middleware/workspace.ts`

**Interfaces:**
- Consumes: `fetchWorkspaceList`, `fetchWorkspaceData`, `fetchSettings`, `isFresh` from Task 1.
- Produces: client navigation returns before data resolves; `data.global.ts` still awaits on the server.

- [ ] **Step 1: Split server and client paths in `app/middleware/data.global.ts`**

Keep the existing path parsing. When `import.meta.server`, run the current awaited flow unchanged. When client:
- `void fetchSettings()` when `!isFresh('settings')`.
- For `/workspaces/:slug`: await only `fetchWorkspaceList()` when the workspace list is empty or stale, then `void fetchWorkspaceData(slug)` and return. The small list request keeps slug validation correct; tasks and materials stay in the background.
- For other private paths, `void fetchWorkspaceList()` when `!isFresh('workspaces')`.
- Return `undefined` in every branch.

Update the file's top comment to say SSR awaits all data and client navigation awaits only the workspace list.

- [ ] **Step 2: Leave `app/middleware/workspace.ts` synchronous**

The list is already awaited by `data.global.ts` on client navigation and by the full SSR flow, so the existing cache lookup and 404 stay unchanged. Do not add a fetch here; that would duplicate the in-flight guard and could 404 while the list is still loading.

- [ ] **Step 3: Verify types**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 4: Manual check**

Start `pnpm dev`. With DevTools throttling at "Slow 4G", click Dashboard → a workspace → Tasks. Expected: sidebar and header appear immediately, content area shows a skeleton, then data. Invalid slug `/workspaces/does-not-exist` shows the 404 page after the workspace list resolves.

- [ ] **Step 5: Commit**

```bash
git add app/middleware/data.global.ts
git commit -m "feat(navigation): render client routes before data resolves"
```

---

### Task 5: Layout shell skeletons

**Files:**
- Modify: `app/layouts/dashboard.vue`
- Modify: `app/layouts/workspaces.vue`
- Modify: `app/components/layouts/AppHeader.vue`

**Interfaces:**
- Consumes: `useDataStatus` (Task 2), `SidebarSkeleton` (Task 3), `isFresh` isn't needed here.
- Produces: sidebar list/name/counts show skeletons when the relevant key is not ready.

- [ ] **Step 1: `dashboard.vue` sidebar list**

```ts
const { showSkeleton: workspacesPending } = useDataStatus('workspaces')
```

Render `<SkeletonsSidebarSkeleton v-if="workspacesPending" />` in place of the `Item` list. Keep the existing `Empty` for the hydrated-and-empty case only (`v-else-if="!workspaces.length"`).

- [ ] **Step 2: `workspaces.vue` name and counts**

Keys: `workspace:${workspace?.id ?? 0}` for the screen data and `workspaces` for the sidebar list. Replace:
- The Timeline card `workspace?.name` with `<Skeleton class="h-3 w-24" />` when the workspace key is not ready.
- The Tasks and Materials count badges with `<Skeleton class="h-3.5 w-6 rounded" />` when not ready.

- [ ] **Step 3: `AppHeader.vue` greeting name**

When the settings key is not ready, render `<Skeleton class="inline-block h-4 w-20 align-middle" />` in place of the user's first name inside `headingDesktop`. Keep the existing SSR-safe greeting prefix.

- [ ] **Step 4: Verify types and lint**

Run: `pnpm typecheck`
Expected: exit 0.
Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/layouts/dashboard.vue app/layouts/workspaces.vue app/components/layouts/AppHeader.vue
git commit -m "feat(layout): skeleton sidebar and header while data loads"
```

---

### Task 6: Dashboard page

**Files:**
- Modify: `app/pages/dashboard.vue`

**Interfaces:**
- Consumes: `useDataStatus('workspaces')`, `TableSkeleton`, `ContentError`, `fetchWorkspaceList`.
- Produces: dashboard table skeleton + retry.

- [ ] **Step 1: Wire status**

```ts
const { showSkeleton, error } = useDataStatus('workspaces')
function retryWorkspaces() { void fetchWorkspaceList({ force: true }) }
```

- [ ] **Step 2: Render branches inside the `Card`**

Order: `ContentError` when `error`; else `TableSkeleton :rows="6"` with widths `['h-4 w-40', 'h-4 w-32', 'hidden sm:block h-4 w-28', 'h-4 w-8']` when `showSkeleton`; else the existing `DataTable`.

This is Review Focus 5: the `Empty` table slot must never render while pending or errored.

- [ ] **Step 3: Manual check**

Cold-load `/dashboard` with cache cleared (hard reload on the page, then a client navigation from `/`). Expected: stats show `0`/`—` only until the skeleton replaces the table area; no "No workspaces yet" flash; forced network failure shows Retry.

- [ ] **Step 4: Verify and commit**

Run: `pnpm typecheck` → exit 0.
```bash
git add app/pages/dashboard.vue
git commit -m "feat(dashboard): skeleton and retry for workspace list"
```

---

### Task 7: Overview page

**Files:**
- Modify: `app/pages/workspaces/[slug]/index.vue`

**Interfaces:**
- Consumes: `useDataStatus` with key `workspace:${workspace?.id ?? 0}`, `PageHeaderSkeleton`, `ContentError`.
- Produces: overview header/stats region skeleton.

- [ ] **Step 1: Wire status**

```ts
const key = computed(() => `workspace:${workspace.value?.id ?? 0}`)
const { showSkeleton, error } = useDataStatus(key)
```

- [ ] **Step 2: Render branches**

Inside `<main>`, wrap the existing content:
- `ContentError` when `error`.
- Otherwise `<div v-if="showSkeleton">` with `PageHeaderSkeleton` plus an `OverviewStats`-shaped grid of four `Skeleton class="h-24"` cards.
- Otherwise existing content with `class="content-fade-in"`.

Ensure `OverviewStats` only renders when `!showSkeleton`, so the four placeholder cards keep the same grid dimensions.

- [ ] **Step 3: Verify and commit**

Run: `pnpm typecheck` → exit 0.
```bash
git add app/pages/workspaces/[slug]/index.vue
git commit -m "feat(overview): skeleton while workspace data loads"
```

---

### Task 8: Tasks and Materials list pages

**Files:**
- Modify: `app/pages/workspaces/[slug]/tasks/index.vue`
- Modify: `app/pages/workspaces/[slug]/materials/index.vue`

**Interfaces:**
- Consumes: `useDataStatus` with the workspace key, `TableSkeleton`, `ContentError`, `fetchWorkspaceData`.
- Produces: table skeletons that match `tasksPageColumns` and `materialsPageColumns` widths.

- [ ] **Step 1: `tasks/index.vue`**

Read `workspace` from the injected context (extend the local `WorkspaceContext` interface with `workspace: Ref<Workspace | undefined>`). Add:
```ts
const key = computed(() => `workspace:${workspace.value?.id ?? 0}`)
const { showSkeleton, error } = useDataStatus(key)
function retryWorkspace() { void fetchWorkspaceData(slug.value, { force: true }) }
```

Inside the `Card`, branch: `ContentError` → `TableSkeleton` with widths mirroring the column class map `['w-12', 'h-4 w-48', 'hidden sm:block w-44', 'hidden sm:block w-36', 'hidden sm:block w-24', 'hidden sm:block w-52', 'w-12']` → existing `DataTable`.

- [ ] **Step 2: `materials/index.vue`**

Same wiring and branch, widths `['h-4 w-48', 'hidden sm:block w-44', 'hidden sm:block w-32', 'hidden sm:block w-64', 'hidden sm:block w-36', 'w-12']`. Keep the toolbar (search/filter) visible during loading; only the card body is replaced.

- [ ] **Step 3: Manual check**

With warm cache, switch Tasks ↔ Materials. Expected: no skeleton (cache is fresh), content swaps instantly. After 30 seconds or a hard reload, expect the skeleton then content. This is Review Focus 2: switch between two workspaces quickly and confirm each header keeps its own rows.

- [ ] **Step 4: Verify and commit**

Run: `pnpm typecheck` → exit 0.
```bash
git add app/pages/workspaces/[slug]/tasks/index.vue app/pages/workspaces/[slug]/materials/index.vue
git commit -m "feat(workspaces): skeleton task and material tables"
```

---

### Task 9: Detail pages with deferred 404

**Files:**
- Modify: `app/pages/workspaces/[slug]/tasks/[id].vue`
- Modify: `app/pages/workspaces/[slug]/materials/[id].vue`
- Modify: `app/components/workspaces/task-detail/taskDetailContext.ts`
- Modify: `app/components/workspaces/material-detail/materialDetailContext.ts`

**Interfaces:**
- Consumes: `useDataStatus` with key `workspace:${ctx.workspace.value?.id ?? 0}`, `DetailSkeleton`, `ContentError`, `fetchWorkspaceData`.
- Produces: detail skeleton while pending; 404 only when `ready && !entity`.

- [ ] **Step 1: Extend the two detail context interfaces**

In `taskDetailContext.ts` and `materialDetailContext.ts`, add `workspace: Ref<Workspace | undefined>` and import `Workspace` from `~/types`. The layout already provides this field; the interfaces only need to expose it.

- [ ] **Step 2: Replace the eager throw in `tasks/[id].vue`**

Remove `createError` at setup. Add:

```ts
const workspaceKey = computed(() => `workspace:${ctx.workspace.value?.id ?? 0}`)
const { ready, showSkeleton, error } = useDataStatus(workspaceKey)

if (import.meta.server && !task.value) {
  throw createError({ statusCode: 404, statusMessage: 'Task not found' })
}

watch([task, ready], ([value, isReady]) => {
  if (!value && isReady) {
    showError({ statusCode: 404, statusMessage: 'Task not found' })
  }
}, { immediate: true })
```

Keep the breadcrumb watcher and `onUnmounted` cleanup unchanged.

- [ ] **Step 3: Render branches in `tasks/[id].vue`**

Inside `<main>`: `ContentError` with `retryWorkspace` when errored; `DetailSkeleton` when `showSkeleton`; the existing `<div v-if="task" class="flex flex-col gap-6 content-fade-in">` otherwise. Retry calls `fetchWorkspaceData(slug.value, { force: true })`.

- [ ] **Step 4: Apply the same pattern in `materials/[id].vue`**

Use `Material not found`, the same key, `DetailSkeleton`, and `content-fade-in` on the existing content wrapper. Keep the edit dialog/drawer and delete dialogs outside the loading branch so they are not remounted.

- [ ] **Step 5: Manual check**

With a warm cache, open a deleted or unknown detail id. Expected: immediate 404. With a cold cache (hard reload directly on a valid detail URL), expect SSR HTML then skeleton-free hydration. With a cold cache reached by client navigation to a valid id, expect the skeleton then the detail. This covers Review Focus 3 and 4.

- [ ] **Step 6: Verify and commit**

Run: `pnpm typecheck` → exit 0.
```bash
git add app/pages/workspaces/[slug]/tasks/[id].vue app/pages/workspaces/[slug]/materials/[id].vue app/components/workspaces/task-detail/taskDetailContext.ts app/components/workspaces/material-detail/materialDetailContext.ts
git commit -m "feat(detail): skeleton detail pages and defer 404 until hydrated"
```

---

### Task 10: Verification pass

**Files:** none.

- [ ] **Step 1: Run the full checks**

Run: `pnpm lint`
Expected: exit 0.
Run: `pnpm typecheck`
Expected: exit 0.
Run: `pnpm build`
Expected: build completes without errors (about 9 minutes).

- [ ] **Step 2: Manual matrix with DevTools throttling**

- `/` → `/dashboard` cold: shell + table skeleton, then rows.
- Dashboard → workspace: sidebar/header immediate; overview skeleton.
- Tasks ↔ Materials warm: no skeleton.
- Two workspaces switched quickly: no cross-contamination (Review Focus 2).
- Invalid workspace slug: 404, no infinite skeleton (Review Focus 1).
- Invalid detail id: 404 after hydration (Review Focus 3).
- Direct SSR load of a detail URL: complete HTML, no skeleton (Review Focus 4).
- Offline/blocked `/api/workspaces`: `ContentError` with Retry (Review Focus 5).
- Toggle OS "reduce motion": no fade, `animate-pulse` remains the only motion from Skeleton.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(ui): address skeleton verification findings"
```

Only commit when Step 2 produced changes.
