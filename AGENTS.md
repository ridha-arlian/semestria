# AGENTS.md

## Setup and verification
- pnpm 12.14 is pinned. `pnpm install` also runs `nuxt prepare`; run it after pulling so `.nuxt/` types exist.
- Verify with `pnpm lint` and `pnpm typecheck`. There is no test script, test suite, CI workflow, or formatter config.
- Match the existing style and avoid reformatting unrelated files; no Prettier setup exists.
- This is one Nuxt app despite `pnpm-workspace.yaml` — that file only whitelists dependency build scripts, so there are no workspace packages to `--filter`.
- Add shadcn-vue primitives with `pnpm dlx shadcn-vue@latest add <name>`; `components.json` outputs to `app/components/ui`.

## Architecture
- Nuxt 4 source lives in `app/`; `~`/`@` resolve to `app/`, `~~` to the repo root. There is no `server/`, database, or HTTP client.
- Data is mock and in-memory in `app/composables/useApi.ts`; no Pinia or persistence. Reloads reset to seed data; dashboard and workspace CRUD mutate the live session state, and workspace aggregates are derived from tasks/materials.
- `app/layouts/workspaces.vue` is the workspace controller: it loads tasks/materials into refs, owns task↔material links and activity history, and `provide('workspace', ...)`. Every page under `app/pages/workspaces/[slug]/` sets `definePageMeta({ layout: 'workspaces', middleware: 'workspace' })` and consumes that injected context; detail pages 404 if the id is absent.
- `app/middleware/workspace.ts` only validates the slug against mock workspaces.
- When changing an existing material's type, use `planTypeChange` (`app/utils/materialContent.ts`); uploads are simulated with in-memory object URLs in `useMaterialFile`.
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
