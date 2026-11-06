import { ownedTaskId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const db = useDb(event)
  const rows = await db.submissionLink.findMany({
    where: { taskId: id },
    orderBy: { position: 'asc' },
    select: { id: true, url: true },
  })
  return rows
})
