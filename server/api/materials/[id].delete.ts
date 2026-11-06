import { ownedMaterialId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { deleteObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const row = await db.material.findUnique({ where: { id }, select: { storageKey: true, storageProvider: true } })

  if (row?.storageProvider === 'r2' && row.storageKey) {
    await deleteObject(event, row.storageKey).catch(() => {})
  }

  await db.material.delete({ where: { id } }) // cascades to tags/links/task_materials/activities
  return { ok: true }
})
