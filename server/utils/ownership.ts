import type { H3Event } from 'h3'
import { useDb } from './db'
import { requireUser } from './auth'

export async function ownedWorkspaceId(event: H3Event, id: number): Promise<number> {
  const user = await requireUser(event)
  const db = useDb(event)
  const ws = await db.workspace.findFirst({ where: { id, userId: user.id }, select: { id: true } })
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Workspace not found' })
  return ws.id
}

export async function ownedMaterialId(event: H3Event, id: number): Promise<number> {
  const user = await requireUser(event)
  const db = useDb(event)
  const m = await db.material.findFirst({
    where: { id, workspace: { userId: user.id } },
    select: { id: true },
  })
  if (!m) throw createError({ statusCode: 404, statusMessage: 'Material not found' })
  return m.id
}

export async function ownedTaskId(event: H3Event, id: number): Promise<number> {
  const user = await requireUser(event)
  const db = useDb(event)
  const t = await db.task.findFirst({
    where: { id, workspace: { userId: user.id } },
    select: { id: true },
  })
  if (!t) throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return t.id
}
