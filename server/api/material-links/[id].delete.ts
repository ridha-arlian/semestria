import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { logActivity } from '../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.materialLink.findFirst({
    where: { id, material: { workspace: { userId: user.id } } },
    select: { id: true, materialId: true, label: true, url: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Material link not found' })

  await db.materialLink.delete({ where: { id } })
  await logActivity(event, owned.materialId, user.id, 'Link removed', 'Link removed', owned.label ?? owned.url)
  return { ok: true }
})
