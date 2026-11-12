import { requireUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { logActivity } from '../../../utils/activity'
import { deleteObject } from '../../../utils/storage'
import { toMaterial } from '../../../../shared/serialize'
import { isDemoMaterialType } from '../../../../shared/demo'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const before = await db.material.findUnique({ where: { id } })
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Material not found' })

  // Seeded file-backed materials stay readable in the demo, not editable.
  if (user.isDemo && !isDemoMaterialType(before.type))
    throw createError({ statusCode: 403, statusMessage: 'This material type is read-only in demo' })

  const wasFile = before.storageProvider === 'r2'
  const label = before.storageProvider === 'external' ? 'Link removed' : wasFile ? 'File removed' : 'Content removed'

  if (wasFile && before.storageKey) {
    await deleteObject(event, before.storageKey).catch(() => {})
  }

  const updated = await db.material.update({
    where: { id },
    data: { storageProvider: null, storageKey: null, contentUrl: null, contentType: null, fileName: null, fileSize: null },
    include: {
      tags: { orderBy: { id: 'asc' } },
      links: { orderBy: { position: 'asc' } },
      tasks: { select: { taskId: true } },
    },
  })

  await logActivity(event, id, user.id, label, label, before.fileName ?? before.contentUrl ?? undefined)
  return toMaterial(updated)
})
