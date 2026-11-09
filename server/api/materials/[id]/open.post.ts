import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const lastOpenedAt = new Date()
  await db.material.update({ where: { id }, data: { lastOpenedAt } })
  return { lastOpenedAt: lastOpenedAt.toISOString() }
})
