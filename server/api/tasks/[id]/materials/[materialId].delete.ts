import { ownedTaskId } from '../../../../utils/ownership'
import { useDb } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const materialId = Number(getRouterParam(event, 'materialId'))
  if (!Number.isInteger(id) || !Number.isInteger(materialId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  await ownedTaskId(event, id)
  const db = useDb(event)
  await db.taskMaterial.deleteMany({ where: { taskId: id, materialId } })
  return { ok: true }
})
