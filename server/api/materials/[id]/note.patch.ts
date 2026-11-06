import { requireUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { parseOr400, materialNote } from '../../../../shared/schemas'
import { logActivity } from '../../../utils/activity'
import type { Prisma } from '../../../generated/prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const body = parseOr400(materialNote, await readBody(event))

  const before = await db.material.findUnique({ where: { id }, select: { note: true } })
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Material not found' })

  const same = JSON.stringify(before.note ?? null) === JSON.stringify(body.note ?? null)
  if (same) return { ok: true }

  await db.material.update({ where: { id }, data: { note: body.note as Prisma.InputJsonValue } })
  await logActivity(event, id, user.id, 'Note updated', 'Note updated')
  return { ok: true }
})
