# Semestria

Semestria is a student workspace manager for organizing semesters, deadlines, tasks, and study materials in one place. It features a dashboard of workspaces, per-workspace overview/tasks/materials pages, and a responsive app shell with collapsible sidebar, mobile drawer, and command palette — with full light/dark mode support.

## Features

- **Dashboard** — workspace stats, workspace table with row actions (open, set active, edit, delete), and create/edit dialogs.
- **Workspace overview** — stat cards, tasks preview with sorting, study progress (time elapsed, tasks done, status segments), and a weekly focus note.
- **Tasks** — full-page TanStack-powered data table with search, status filter, column visibility, per-row actions (change status, delete), contextual empty states, and tooltips.
- **Materials** — searchable shelf table for notes, books, slides, links, PDFs, and videos.
- **App shell** — collapsible icon sidebar (desktop), auto-closing drawer (mobile), breadcrumbs, global search command palette (`Ctrl`/`Cmd` + `Q`), and color mode toggle.

## Tech Stack

- [Nuxt 4](https://nuxt.com/) + Vue 3 (`<script setup>`, TypeScript) on Cloudflare Workers (Nitro)
- [Prisma 7](https://www.prisma.io/) + PostgreSQL through Cloudflare Hyperdrive
- Cookie-session auth with Google OAuth; R2 presigned uploads for materials and avatars
- [Tailwind CSS 4](https://tailwindcss.com/) with semantic theme tokens (`app/assets/css/tailwind.css`)
- [shadcn-vue](https://www.shadcn-vue.com/) (reka-ui primitives) + [TanStack Table](https://tanstack.com/table) + [VueUse](https://vueuse.org/)
- [pnpm](https://pnpm.io/) (package manager pinned in `package.json`)

## Getting Started

Prerequisites: Node.js 22+ and pnpm. Copy `.env.example` to `.env` first; the API has no mock fallback.

```bash
pnpm install
pnpm exec prisma migrate deploy
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the development server         |
| `pnpm build`     | Build for production (Cloudflare)    |
| `pnpm generate`  | Pre-render a static site             |
| `pnpm preview`   | Preview the production build locally |
| `pnpm typecheck` | Type-check with `vue-tsc`            |
| `pnpm lint`      | Lint with ESLint                     |

## Project Structure

```
app/
├── pages/            # Routes: landing, dashboard, workspaces/[slug]/{index,tasks,materials}
├── layouts/          # Nuxt layouts: dashboard, workspaces, landing
├── components/
│   ├── ui/           # shadcn-vue primitives (button, dialog, table, sidebar, …)
│   ├── layouts/      # AppSidebar, AppHeader (app shell components)
│   ├── dashboard/    # Dashboard widgets (stats, dialogs, workspaceColumns)
│   ├── workspaces/   # Workspace widgets (overview + tasks columns, dropdowns, modals)
│   └── icons/        # App icons and logo
├── composables/      # useApi server adapter + useState caches
├── middleware/       # auth, data prefetch, workspace route guard
├── types/            # Shared types (Task, Workspace, Material, …)
└── assets/css/       # tailwind.css theme tokens (light + dark)
server/               # Nitro API routes and server utilities
shared/               # Schemas, serializers, type-change policy
prisma/               # Schema and migrations
```

Column definitions follow the `<area>-columns.ts` naming scheme (e.g. `overview-tasks-columns.ts`, `tasks-page-columns.ts`) and are consumed through the shared `ui/data-table/DataTable` wrapper.
