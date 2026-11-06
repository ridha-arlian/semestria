import { ownedWorkspaceId } from '../../../../utils/ownership'
import { useDb } from '../../../../utils/db'
import { parseOr400, taskScalar } from '../../../../../shared/schemas'
import { toTask } from '../../../../../shared/serialize'

const PRIORITY_MAP: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' }

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)
  const body = parseOr400(taskScalar, await readBody(event))

  const created = await db.task.create({
    data: {
      workspaceId: id,
      title: body.title,
      course: body.course,
      dueDate: body.due ? new Date(`${body.due}T00:00:00Z`) : null,
      status: 'To do',
      priority: PRIORITY_MAP[body.priority] ?? 'Medium',
      progress: 0,
      description: body.description || null,
      submissions: body.submissionUrl?.trim() ? { create: { url: body.submissionUrl.trim() } } : undefined,
    },
    include: {
      checklist: { orderBy: { position: 'asc' } },
      submissions: { orderBy: { position: 'asc' } },
      materials: { select: { materialId: true } },
    },
  })

  return toTask(created)
})
