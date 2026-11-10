# Skeleton Page Transition Design

**Date:** 2026-11-09
**Status:** Approved

## Intent

Make in-app navigation feel instant. The app currently blocks route rendering on
`app/middleware/data.global.ts`, which awaits `/api/settings`, `/api/workspaces`,
and the workspace's tasks/materials before any layout or page can render. A
skeleton cannot appear during that wait because there is nothing to render.

The change separates SSR from client navigation, renders the shell immediately
on client navigation, and shows layout-matched skeletons while data resolves.

## Goals

- Page switches render the layout and page shell immediately on the client.
- Cold data shows a layout-matched skeleton, never a false empty state.
- Cached data shows immediately; refresh happens silently in the background.
- Direct SSR loads still return complete HTML with no skeleton and no hydration mismatch.
- Fetch failures show a retry affordance instead of an endless skeleton.

## Non-goals

- No visual redesign. Skeletons mirror the existing layout.
- No speculative prefetching of workspaces or detail pages.
- No offline persistence.
- No skeleton on the settings page.
- No change to `experimental.viewTransition`.

## Approaches considered

- **A. Non-blocking client middleware + cache-first + skeletons (chosen).**
  Server keeps awaiting; client starts fetches without awaiting and renders.
- **B. Combined `/api/workspaces/:slug/bootstrap` endpoint while keeping the
  blocking middleware.** Smaller payload, but the route still waits for a
  network round trip before rendering. Rejected: reduces the delay instead of
  removing it.
- **C. Global loading indicator / Nuxt loading bar only.** Leaves the blocking
  middleware in place. Rejected: does not address the cause.

## Behavior

### SSR vs client

`app/middleware/data.global.ts` awaits on the server exactly as today. On the
client it starts the fetch and returns immediately. The first HTML response
therefore contains complete data.

### Workspace slug validation

Client navigation awaits only `/api/workspaces` when the list is empty or
stale, then validates the slug and starts the workspace data fetch in the
background. Tasks and materials never block the route. A wrong slug still 404s
quickly. The existing synchronous `app/middleware/workspace.ts` lookup stays as
is because the list is already resolved before it runs.

### Cache and revalidation

- Keys: `workspaces`, `settings`, `workspace:{id}`.
- `workspace:{id}` is marked hydrated when tasks and materials both resolve.
- TTL is 30 seconds. Within TTL, navigation uses cache without a request.
  Past TTL, the cache is revalidated silently while stale data stays visible.
- A second request for the same key is skipped while one is in flight.
- Fetch failures record an error per key instead of marking hydrated.
- Skeleton replaces only the region whose data is missing. Cached regions never
  show a skeleton.

### Skeleton timing

A skeleton appears only after the data has been pending for 150 ms. Responses
faster than that render directly with no skeleton flash. There is no artificial
minimum display time. Content fades in over 120 ms; `prefers-reduced-motion`
disables the fade.

### Detail pages

A task/material detail page shows `DetailSkeleton` until `workspace:{id}` is
hydrated. A 404 is raised only after hydration, when the id is still absent.
On SSR the data is already awaited, so the existing error path stays.

### Errors

A failed fetch renders `Empty` with a retry button inside the affected content
region. Retrying forces a refetch of that key.

## Components

New, all built on the installed shadcn-vue `Skeleton` from
`app/components/ui/skeleton`:

- `app/components/skeletons/PageHeaderSkeleton.vue`
- `app/components/skeletons/TableSkeleton.vue` — 6 rows desktop, 4 mobile,
  widths matching the real columns
- `app/components/skeletons/DetailSkeleton.vue`
- `app/components/skeletons/SidebarSkeleton.vue`
- `app/components/skeletons/ContentError.vue`

## Files touched

| File | Change |
| --- | --- |
| `app/middleware/data.global.ts` | Await on server only; fire-and-forget on client |
| `app/middleware/workspace.ts` | No change: runs after the list resolves |
| `app/composables/apiCache.ts` | Loading, error, fetched-at state plus helpers |
| `app/composables/useDataFetch.ts` | TTL, in-flight guard, error capture, force refetch |
| `app/composables/useDataStatus.ts` | New: pending/error/showSkeleton for a key |
| `app/pages/dashboard.vue` | Table skeleton and error state |
| `app/pages/workspaces/[slug]/index.vue` | Overview skeleton |
| `app/pages/workspaces/[slug]/tasks/index.vue` | Table skeleton |
| `app/pages/workspaces/[slug]/materials/index.vue` | Table skeleton |
| `app/pages/workspaces/[slug]/tasks/[id].vue` | Detail skeleton, deferred 404 |
| `app/pages/workspaces/[slug]/materials/[id].vue` | Detail skeleton, deferred 404 |
| `app/layouts/dashboard.vue` | Sidebar skeleton for workspace list |
| `app/layouts/workspaces.vue` | Sidebar skeleton for name/counts |
| `app/components/layouts/AppHeader.vue` | Skeleton for settings-dependent name |
| `app/assets/css/tailwind.css` | 120 ms content fade utility |

## Risks

- False 404 on cold cache: handled by deferring until hydrated.
- Skeleton flash: handled by the 150 ms threshold.
- Stale response overwriting newer data: guarded by an in-flight check plus
  writing into the per-workspace cache instead of replacing the whole arrays.
- SSR hydration mismatch: skeletons render only after client middleware has
  started the fetch; SSR still waits for data.

## Verification

`pnpm lint`, `pnpm typecheck`, `pnpm build`, then manual checks with network
throttling: dashboard → workspace → Tasks → Materials → detail, back
navigation, invalid slug, invalid detail id, and direct SSR load of a detail URL.
