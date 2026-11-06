import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { logActivity } from '../../utils/activity'

const bodySchema = z.object({
  url: z.string().url().max(2000).optional(),
  label: z.string().max(120).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.materialLink.findFirst({
    where: { id, material: { workspace: { userId: user.id } } },
    select: { id: true, materialId: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Material link not found' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid body' })

  const updated = await db.materialLink.update({
    where: { id },
    data: {
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.label !== undefined ? { label: parsed.data.label?.trim() || null } : {}),
    },
  })

  await logActivity(event, owned.materialId, user.id, 'Link updated', 'Link updated', updated.label ?? updated.url)
  return { id: updated.id, url: updated.url, label: updated.label ?? undefined }
})
