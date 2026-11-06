import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'

const bodySchema = z.object({ url: z.string().url().max(2000) })

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.submissionLink.findFirst({
    where: { id, task: { workspace: { userId: user.id } } },
    select: { id: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Submission link not found' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'A valid url is required' })

  const updated = await db.submissionLink.update({ where: { id }, data: { url: parsed.data.url } })
  return { id: updated.id, url: updated.url }
})
