import { z } from 'zod'
import { ownedTaskId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { syncTaskProgress } from '../../../utils/taskProgress'

const bodySchema = z.object({ title: z.string().min(1).max(300) })

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'title is required' })

  const db = useDb(event)
  return db.$transaction(async (tx) => {
    const items = await tx.checklistItem.findMany({ where: { taskId: id }, orderBy: { position: 'asc' } })
    const created = await tx.checklistItem.create({
      data: { taskId: id, title: parsed.data.title.trim(), done: false, position: items.length },
    })
    await syncTaskProgress(tx, id)
    return { id: created.id, title: created.title, done: created.done }
  })
})
