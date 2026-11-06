import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { toActivity } from '../../../../shared/serialize'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)

  // The create handler already logs a `Created` row. Adding a synthetic one
  // here duplicated it and used `reviewedAt` as the creation time.
  const rows = await db.activity.findMany({
    where: { materialId: id },
    orderBy: { id: 'desc' },
  })

  return rows.map(toActivity)
})
