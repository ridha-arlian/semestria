# AGENTS.md

## Setup and verification
- pnpm 12.14 is pinned. `pnpm install` runs `prisma generate` then `nuxt prepare`; run it after pulling so `.nuxt/` and `server/generated/prisma` exist.
- Copy `.env.example` to `.env` (or use `.dev.vars` for Wrangler). Nuxt runtime config reads `NUXT_*` names; the Prisma CLI reads `DATABASE_URL` / `DIRECT_URL`.
- Verify with `pnpm lint` and `pnpm typecheck`. Run `pnpm build` for server, auth, Prisma, or Cloudflare changes (about 9 minutes). There is no test script, test suite, CI workflow, or formatter config.
- Match the existing style and avoid reformatting unrelated files; no Prettier setup exists.
- This is one Nuxt app despite `pnpm-workspace.yaml` — that file only whitelists dependency build scripts, so there are no workspace packages to `--filter`.
- Add shadcn-vue primitives with `pnpm dlx shadcn-vue@latest add <name>`; `components.json` outputs to `app/components/ui`.
- Prisma lives in `prisma/`; regenerate the client with `pnpm exec prisma generate` and apply migrations with `pnpm exec prisma migrate deploy`.

## Architecture
- Nuxt 4 app code lives in `app/`, Nitro handlers in `server/`, and pure shared modules in `shared/`. `~`/`@` resolve to `app/`, `~~` to the repo root.
- Persistence is Postgres through Prisma 7 (`server/utils/db.ts`, adapter-pg). Production uses the Cloudflare Hyperdrive `HYPERDRIVE` binding; local dev falls back to `NUXT_DATABASE_URL`. The generated client in `server/generated/prisma` is gitignored.
- Auth uses a sealed cookie session (`server/utils/auth.ts`) plus Google OAuth. `app/middleware/auth.global.ts` guards private pages and preserves the `redirect` query.
- Client data is server-backed: `app/middleware/data.global.ts` prefetches through `useDataFetch` into the `useState` caches in `app/composables/apiCache.ts`; `app/composables/useApi.ts` is the mutation adapter.
- Files upload straight to R2 with a presigned PUT, then `PATCH /api/materials/:id/content` verifies the key and commits it. Avatars use private `/api/me/avatar` endpoints. The R2 bucket needs CORS rules for browser PUTs.
- `app/layouts/workspaces.vue` is the workspace controller: it loads tasks/materials into refs, owns task↔material links and activity history, and `provide('workspace', ...)`. Every page under `app/pages/workspaces/[slug]/` sets `definePageMeta({ layout: 'workspaces', middleware: 'workspace' })` and consumes that injected context; detail pages 404 if the id is absent.
- `app/middleware/workspace.ts` validates the slug against the prefetched workspace list.
- Material type changes are planned twice: client `app/utils/materialContent.ts` and server `shared/materialPlan.ts`; keep them in sync. `shared/schemas.ts` validates payloads and `shared/serialize.ts` maps Prisma rows to app types.
- Rich notes are TipTap JSON or legacy strings (`MaterialNote`); ProseMirror styles are global in `app/assets/css/tailwind.css` because scoped styles cannot reach its DOM.

## Data tables
- `app/components/ui/data-table/DataTable.vue` uses TanStack Table v9 (`useTable`/`tableFeatures`, not v8's `useVueTable`).
- `features.ts` registers only `columnVisibilityFeature`; sorting, filtering, and pagination do nothing until their feature is added there.
- Column definitions live beside their area (e.g. `tasks-page-columns.ts`, `materials-page-columns.ts`, `workspaceColumns.ts`), use `createColumnHelper<DataTableFeatures, T>()`, render with `h()`, and call `table.options.meta?.onX`. `showHeader` is opt-in; use `mobileHiddenColumns`/`columnClass` for responsive layout. Row-action cells must stop click propagation.
- SSR renders at a fixed 1024px (`app/plugins/ssr-width.ts`), so mobile-only table content appears after hydration.

## Styling
- Tailwind CSS 4 is CSS-first: theme tokens are in `app/assets/css/tailwind.css`; there is no `tailwind.config.*`.
- Use semantic tokens (`bg-paper`, `text-ink`, `border-line`, `bg-soft`, `text-subline`, `text-headline`, `text-text-strong`, plus `status-*`/`priority-*`/`urgency-*`) instead of raw palette classes or `dark:` overrides. Dark mode is the `.dark` class.
- `cn()` is at `app/lib/utils.ts`.
- Treat `app/components/ui/**` as vendored shadcn-vue output: put app-specific behavior outside it, and expect relaxed ESLint rules for `.vue` files there. `app/components/ui/data-table` is repo-owned and should be edited directly.
- Icons import from `@lucide/vue`, not `lucide-vue-next`.

## Conventions
- Components auto-import by path (`components/layouts/AppSidebar.vue` → `<LayoutsAppSidebar>`); some files import explicitly. Follow the nearest file.
- Conventional Commits (`feat(materials): ...`, `fix: ...`); default branch is `main`.
- UI copy is English; a few Indonesian strings remain in middleware/seed data, and there is no i18n layer.
- The repo pins shadcn-vue guidance in `.agents/skills/shadcn-vue/` (listed in `skills-lock.json`). It references `Field`, `InputGroup`, `Empty`, and `Spinner`, which are not installed here — check `app/components/ui` before following those examples.
