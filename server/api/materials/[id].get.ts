import { ownedMaterialId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { toMaterial } from '../../../shared/serialize'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const row = await db.material.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { id: 'asc' } },
      links: { orderBy: { position: 'asc' } },
      tasks: { select: { taskId: true } },
    },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Material not found' })
  return toMaterial(row)
})
