import { ownedTaskId } from '../../utils/ownership'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const db = useDb(event)
  await db.task.delete({ where: { id } }) // cascades to checklist/submissions/task_materials
  return { ok: true }
})
