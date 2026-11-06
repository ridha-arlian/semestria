import { z } from 'zod'
import { ownedTaskId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'

const bodySchema = z.object({ url: z.string().url().max(2000) })

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'A valid url is required' })

  const db = useDb(event)
  const subs = await db.submissionLink.findMany({ where: { taskId: id }, orderBy: { position: 'asc' } })
  const created = await db.submissionLink.create({
    data: { taskId: id, url: parsed.data.url, position: subs.length },
  })
  return { id: created.id, url: created.url }
})
