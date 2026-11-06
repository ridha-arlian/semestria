import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { syncTaskProgress } from '../../utils/taskProgress'

const bodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  done: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = useDb(event)
  const owned = await db.checklistItem.findFirst({
    where: { id, task: { workspace: { userId: user.id } } },
    select: { id: true, taskId: true },
  })
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Checklist item not found' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid body' })

  return db.$transaction(async (tx) => {
    const row = await tx.checklistItem.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
        ...(parsed.data.done !== undefined ? { done: parsed.data.done } : {}),
      },
    })
    // A title edit does not change completion; only a done toggle does.
    if (parsed.data.done !== undefined)
      await syncTaskProgress(tx, owned.taskId)
    return { id: row.id, title: row.title, done: row.done }
  })
})
