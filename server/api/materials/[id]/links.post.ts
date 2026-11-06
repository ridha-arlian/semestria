import { requireUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { parseOr400, materialLink } from '../../../../shared/schemas'
import { logActivity } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const body = parseOr400(materialLink, await readBody(event))

  const links = await db.materialLink.findMany({ where: { materialId: id }, orderBy: { position: 'asc' } })
  const created = await db.materialLink.create({
    data: { materialId: id, url: body.url, label: body.label?.trim() || null, position: links.length },
  })

  await logActivity(event, id, user.id, 'Link added', 'Link added', created.label ?? created.url)
  return { id: created.id, url: created.url, label: created.label ?? undefined }
})
