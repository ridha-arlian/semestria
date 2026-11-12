# Semestria

Semestria is a workspace manager for organizing projects, deadlines, tasks, and materials in one place. It pairs a dashboard of workspaces with per-workspace overview, tasks, and materials pages in a responsive app shell.

Semestria is in active development. The roadmap below describes planned tiers and capabilities; limits and prices may change.

## Features

- **Dashboard** — workspace stats, workspace table with row actions (open, set active, edit, delete), and create/edit dialogs.
- **Workspace overview** — stat cards, tasks preview with sorting, progress (time elapsed, tasks done, status segments), and a weekly focus note.
- **Tasks** — full-page TanStack-powered data table with search, status filter, column visibility, per-row actions (change status, delete), contextual empty states, and tooltips.
- **Materials** — searchable shelf table for notes, books, slides, links, PDFs, and videos.
- **App shell** — collapsible icon sidebar (desktop), auto-closing drawer (mobile), breadcrumbs, global search command palette (`Ctrl`/`Cmd` + `Q`), and color mode toggle.
- **Demo mode** — a disposable guest workspace with seeded data, sandboxed to the session.

## Roadmap

### Free

- 1–2 active workspaces, unlimited tasks and materials
- 100–200 MB storage, 5–10 MB per file
- Basic email reminders (one day before)
- Basic calendar and schedule views
- AI agent with a small allowance

### Pro

- Unlimited workspaces, 2–5 GB storage, PDF and video preview
- Advanced notifications (web push, Telegram/WhatsApp, custom reminders)
- Google Calendar sync, ICS/CSV export
- Personal metrics, time-tracking stats, automated weekly review
- Recurring tasks, subtasks, and collaboration
- Larger AI quota

### Pricing and billing

- Annual or per-term subscriptions, USD with regional (PPP) adjustments
- Midtrans for Indonesia, Paddle/Stripe for global payments
- Paywall goes live only after active users exist and costs become meaningful

### AI agent (phased)

1. Create tasks from text or files
2. Natural-language command palette, split tasks into subtasks
3. Project plans and weekly reviews
4. Material summaries, flashcards, and Q&A over your materials (RAG)

### AI infrastructure

- Single entry point (`server/utils/ai.ts`) so providers are replaceable
- Production: low-cost API model (Qwen) or Cloudflare Workers AI; Ollama only for local development
- Cloudflare-style stack: Workers, Workers AI, Vectorize or pgvector, AI Gateway (cache, rate limits, logs, cost control)
- Choose the cheapest model that passes 20–30 real examples

### AI guardrails

- Models only propose; the server validates with Zod and executes, the user approves
- Limited tool allowlist, `userId`/`workspaceId` from the session, confirmation for destructive actions
- Documents are treated as data (prompt-injection aware), read-only flows for document ingestion
- Per-user quota, rate limits, step limits, daily budget cap
- Structured output, dates computed in code, "AI-generated" label and undo
- Privacy: disclose model-provider data sharing, allow users to disable AI

### Before the paywall

- i18n (ID + EN), per-user time zones
- Privacy policy, terms, account deletion

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
