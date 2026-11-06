import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.submissionLink.findFirst({
    where: { id, task: { workspace: { userId: user.id } } },
    select: { id: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Submission link not found' })

  await db.submissionLink.delete({ where: { id } })
  return { ok: true }
})
