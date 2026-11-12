import { requireFullAccessUser } from '../../utils/auth'
import { ownedWorkspaceId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { deleteObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  await requireFullAccessUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)

  // Cascades remove rows only; R2 objects need explicit cleanup.
  const files = await db.material.findMany({
    where: { workspaceId: id, storageProvider: 'r2', storageKey: { not: null } },
    select: { storageKey: true },
  })

  await db.workspace.delete({ where: { id } }) // cascades to tasks/materials/checklists/links/activities

  for (const file of files) {
    if (file.storageKey)
      await deleteObject(event, file.storageKey).catch(() => {})
  }

  return { ok: true }
})
