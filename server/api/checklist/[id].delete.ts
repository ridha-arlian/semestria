import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { syncTaskProgress } from '../../utils/taskProgress'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.checklistItem.findFirst({
    where: { id, task: { workspace: { userId: user.id } } },
    select: { id: true, taskId: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Checklist item not found' })

  await db.$transaction(async (tx) => {
    await tx.checklistItem.delete({ where: { id } })
    await syncTaskProgress(tx, owned.taskId)
  })

  return { ok: true }
})
