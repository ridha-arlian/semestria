import { ownedTaskId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { toTask } from '../../../shared/serialize'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const db = useDb(event)
  const row = await db.task.findUnique({
    where: { id },
    include: {
      checklist: { orderBy: { position: 'asc' } },
      submissions: { orderBy: { position: 'asc' } },
      materials: { select: { materialId: true } },
    },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return toTask(row)
})
