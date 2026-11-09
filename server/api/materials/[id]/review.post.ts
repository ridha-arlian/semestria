import { requireUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { logActivity } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const reviewedAt = new Date()
  await db.material.update({ where: { id }, data: { reviewedAt } })
  await logActivity(event, id, user.id, 'Marked reviewed', 'Marked reviewed')
  return { reviewedAt: reviewedAt.toISOString() }
})
