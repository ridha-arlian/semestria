import { createHmac, randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { useDb } from './db'
import {
  DEMO_MATERIAL_LIMIT,
  DEMO_MAX_ACTIVE_USERS,
  DEMO_RETENTION_DAYS,
  DEMO_STARTS_PER_HOUR,
  DEMO_TASK_LIMIT,
} from '../../shared/demo'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const DEMO_EMAIL_DOMAIN = 'demo.semestria.local'

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['$transaction']>[0]>[0]

export interface DemoStartResult {
  redirect: string
  reused: boolean
}

function startOfUtcDay(date = new Date()): Date {
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY)
}

/** Hash the visitor IP so the rate limit never stores raw addresses. */
function hashIp(event: H3Event, ip: string): string {
  const secret = useRuntimeConfig(event).sessionPassword || 'semestria-demo'
  return createHmac('sha256', secret).update(ip).digest('hex')
}

function demoEmail(): string {
  return `demo+${randomUUID()}@${DEMO_EMAIL_DOMAIN}`
}

function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

async function enforceRateLimit(db: Db, ipHash: string): Promise<void> {
  const since = new Date(Date.now() - HOUR)
  const recent = await db.user.count({
    where: { isDemo: true, demoIpHash: ipHash, createdAt: { gte: since } },
  })
  if (recent >= DEMO_STARTS_PER_HOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many demo sessions. Try again later.',
    })
  }
}

/** Opportunistic cleanup: no cron binding needed. */
async function cleanupExpired(db: Db): Promise<void> {
  await db.user.deleteMany({
    where: {
      isDemo: true,
      createdAt: { lt: new Date(Date.now() - DEMO_RETENTION_DAYS * DAY) },
    },
  })
}

async function enforceGlobalCap(db: Db): Promise<void> {
  const active = await db.user.count({ where: { isDemo: true } })
  if (active >= DEMO_MAX_ACTIVE_USERS) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Demo is full, try again later',
    })
  }
}

const NOTE_DOC = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Hash tables' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'A hash function maps a key to a bucket. Collisions are resolved by chaining or open addressing.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Average lookup: O(1)' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Worst case: O(n) with every key colliding' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Resize when load factor passes 0.75' }] }] },
      ],
    },
  ],
}

async function seedWorkspace(tx: Tx, userId: string) {
  const today = startOfUtcDay()
  const weekday = (today.getUTCDay() + 6) % 7 // Monday = 0
  const monday = addDays(today, -weekday)
  const startDate = addDays(monday, -28)
  const endDate = addDays(monday, 70)
  const currentWeek = Math.floor((today.getTime() - startDate.getTime()) / (7 * DAY)) + 1

  const workspace = await tx.workspace.create({
    data: {
      userId,
      name: 'Fall 2026',
      slug: 'fall-2026',
      startDate,
      endDate,
      isActive: true,
      focusNotes: {
        [String(currentWeek)]: 'Midterms are close — keep the problem sets moving and review the hash-table notes.',
      },
    },
  })

  const taskSeeds = [
    {
      title: 'Problem set 3',
      course: 'Data Structures',
      due: 0,
      status: 'In progress',
      priority: 'High',
      description: 'Graph traversal exercises, questions 1–6.',
      checklist: [['Read the assignment sheet', true], ['Implement BFS', true], ['Implement DFS', false]] as [string, boolean][],
    },
    {
      title: 'Read chapter 5',
      course: 'Linear Algebra',
      due: 2,
      status: 'To do',
      priority: 'Medium',
      description: 'Eigenvalues and eigenvectors, pages 141–168.',
      checklist: [] as [string, boolean][],
    },
    {
      title: 'Lab report',
      course: 'Organic Chemistry',
      due: -1,
      status: 'In progress',
      priority: 'High',
      description: 'Write up the reaction mechanism results from Friday.',
      checklist: [['Collect measurements', true], ['Plot the results', true], ['Write the discussion', true], ['Proofread', false]] as [string, boolean][],
    },
    {
      title: 'Essay draft',
      course: 'Academic Writing',
      due: 4,
      status: 'To do',
      priority: 'Medium',
      description: 'A 1,200-word draft on citation practices.',
      checklist: [] as [string, boolean][],
    },
    {
      title: 'Midterm review',
      course: 'Linear Algebra',
      due: 6,
      status: 'To do',
      priority: 'Low',
      description: 'Rebuild the summary sheet from lecture notes.',
      checklist: [] as [string, boolean][],
    },
    {
      title: 'Group presentation',
      course: 'Data Structures',
      due: 3,
      status: 'In progress',
      priority: 'Medium',
      description: 'Ten minutes on balanced trees.',
      checklist: [['Split the sections', true], ['Make slides', false], ['Rehearse', false]] as [string, boolean][],
    },
    {
      title: 'Problem set 2',
      course: 'Data Structures',
      due: -5,
      status: 'Done',
      priority: 'High',
      description: 'Sorted and submitted.',
      checklist: [['Finish Q1–Q3', true], ['Finish Q4', true]] as [string, boolean][],
    },
    {
      title: 'Annotated bibliography',
      course: 'Academic Writing',
      due: -2,
      status: 'Done',
      priority: 'Low',
      description: 'Six sources with a short note each.',
      checklist: [] as [string, boolean][],
    },
  ]

  const tasks: { id: number }[] = []
  for (const [index, seed] of taskSeeds.entries()) {
    const checklist = seed.checklist.map(([title, done], position) => ({ title, done, position }))
    const done = checklist.filter(item => item.done).length
    const progress = checklist.length
      ? Math.round((done / checklist.length) * 100)
      : seed.status === 'Done' ? 100 : seed.status === 'In progress' ? 50 : 0

    tasks.push(await tx.task.create({
      data: {
        workspaceId: workspace.id,
        title: seed.title,
        course: seed.course,
        dueDate: addDays(today, seed.due),
        status: seed.status,
        priority: seed.priority,
        progress,
        description: seed.description,
        checklist: checklist.length ? { create: checklist } : undefined,
        createdAt: addDays(today, -10 + index),
      },
      select: { id: true },
    }))
  }

  const materialSeeds = [
    {
      title: 'Week 6 — Hash tables',
      course: 'Data Structures',
      type: 'Notes',
      note: NOTE_DOC,
      tags: ['lecture', 'exam'],
    },
    {
      title: 'Linear Algebra — Lecture 5',
      course: 'Linear Algebra',
      type: 'PDF',
      contentUrl: 'https://example.com/materials/linear-algebra-lecture-5.pdf',
      tags: ['lecture'],
    },
    {
      title: 'Reaction mechanisms deck',
      course: 'Organic Chemistry',
      type: 'Slides',
      contentUrl: 'https://example.com/materials/reaction-mechanisms.pdf',
      tags: ['lab'],
    },
    {
      title: 'Big-O cheatsheet',
      course: 'Data Structures',
      type: 'Link',
      contentUrl: 'https://example.com/reference/big-o-cheatsheet',
      tags: ['reference'],
    },
    {
      title: 'Recursion walkthrough',
      course: 'Data Structures',
      type: 'Video',
      contentUrl: 'https://example.com/videos/recursion-walkthrough',
      tags: ['review'],
    },
    {
      title: 'Academic Writing sources',
      course: 'Academic Writing',
      type: 'Collection',
      tags: ['essay'],
      links: [
        { url: 'https://example.com/library/citation-styles', label: 'Citation styles guide', position: 0 },
        { url: 'https://example.com/library/academic-integrity', label: 'Academic integrity policy', position: 1 },
      ],
    },
  ] as const

  const materials: { id: number }[] = []
  for (const [index, seed] of materialSeeds.entries()) {
    const contentUrl = 'contentUrl' in seed ? seed.contentUrl : null
    materials.push(await tx.material.create({
      data: {
        workspaceId: workspace.id,
        title: seed.title,
        course: seed.course,
        type: seed.type,
        note: 'note' in seed ? seed.note : undefined,
        storageProvider: contentUrl ? 'external' : null,
        contentUrl,
        tags: { create: seed.tags.map(tag => ({ tag })) },
        links: 'links' in seed ? { create: seed.links.map(link => ({ ...link })) } : undefined,
        createdAt: addDays(today, -8 + index),
      },
      select: { id: true },
    }))
  }

  await tx.taskMaterial.createMany({
    data: [
      { taskId: tasks[0]!.id, materialId: materials[0]!.id },
      { taskId: tasks[2]!.id, materialId: materials[2]!.id },
    ],
  })

  await tx.activity.createMany({
    data: [
      { materialId: materials[0]!.id, actorId: userId, kind: 'Created', label: 'Created', at: addDays(today, -8) },
      { materialId: materials[0]!.id, actorId: userId, kind: 'Note updated', label: 'Note updated', at: addDays(today, -2) },
      { materialId: materials[0]!.id, actorId: userId, kind: 'Task linked', label: 'Task linked', detail: 'Problem set 3', at: addDays(today, -1) },
      { materialId: materials[1]!.id, actorId: userId, kind: 'Marked reviewed', label: 'Marked reviewed', at: addDays(today, -1) },
      { materialId: materials[5]!.id, actorId: userId, kind: 'Created', label: 'Created', at: addDays(today, -3) },
    ],
  })

  return workspace
}

/**
 * Start (or resume) a demo session. Reuses the current demo account so a
 * second click returns the same workspace; real accounts are never replaced.
 */
export async function startDemo(event: H3Event, currentUser: { id: string, isDemo?: boolean } | null): Promise<DemoStartResult> {
  const db = useDb(event)

  if (currentUser && !currentUser.isDemo) {
    throw createError({ statusCode: 409, statusMessage: 'Already signed in' })
  }

  if (currentUser?.isDemo) {
    const workspace = await db.workspace.findFirst({
      where: { userId: currentUser.id },
      orderBy: { isActive: 'desc' },
      select: { publicId: true },
    })
    return { redirect: workspace ? `/w/${workspace.publicId}` : '/dashboard', reused: true }
  }

  const ipHash = hashIp(event, clientIp(event))
  await enforceRateLimit(db, ipHash)
  await cleanupExpired(db)
  await enforceGlobalCap(db)

  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: demoEmail(),
        name: 'Guest',
        avatarHidden: true,
        isDemo: true,
        demoIpHash: ipHash,
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true },
    })
    const workspace = await seedWorkspace(tx, user.id)
    return { user, workspace }
  })

  await setUser(event, {
    id: created.user.id,
    email: created.user.email,
    name: created.user.name,
    isDemo: true,
  }, { demo: true })

  return { redirect: `/w/${created.workspace.publicId}`, reused: false }
}

/** Task/material caps apply across every workspace a demo visitor owns. */
export async function enforceDemoTaskLimit(db: Db, userId: string): Promise<void> {
  const count = await db.task.count({ where: { workspace: { userId } } })
  if (count >= DEMO_TASK_LIMIT) {
    throw createError({ statusCode: 403, statusMessage: `Demo limit reached (${DEMO_TASK_LIMIT} tasks)` })
  }
}

export async function enforceDemoMaterialLimit(db: Db, userId: string): Promise<void> {
  const count = await db.material.count({ where: { workspace: { userId } } })
  if (count >= DEMO_MATERIAL_LIMIT) {
    throw createError({ statusCode: 403, statusMessage: `Demo limit reached (${DEMO_MATERIAL_LIMIT} materials)` })
  }
}
