import { ownedTaskId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { parseOr400, taskPatch } from '../../../shared/schemas'
import { toTask } from '../../../shared/serialize'
import { syncTaskProgress } from '../../utils/taskProgress'

const PRIORITY_MAP: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' }

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const db = useDb(event)
  const body = parseOr400(taskPatch, await readBody(event))

  const updated = await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.course !== undefined ? { course: body.course } : {}),
        ...(body.due !== undefined ? { dueDate: body.due ? new Date(`${body.due}T00:00:00Z`) : null } : {}),
        ...(body.priority !== undefined ? { priority: PRIORITY_MAP[body.priority] ?? 'Medium' } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.note !== undefined ? { note: body.note || null } : {}),
      },
    })

    // Status updates must keep checklist items and progress in sync.
    if (body.status !== undefined)
      await syncTaskProgress(tx, id, body.status)

    return tx.task.findUnique({
      where: { id },
      include: {
        checklist: { orderBy: { position: 'asc' } },
        submissions: { orderBy: { position: 'asc' } },
        materials: { select: { materialId: true } },
      },
    })
  })

  return toTask(updated!)
})
