import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { ownedTaskId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'

const bodySchema = z.object({ materialId: z.number().int().positive() })

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'materialId is required' })

  const db = useDb(event)
  const material = await db.material.findFirst({
    where: { id: parsed.data.materialId, workspace: { userId: user.id } },
    select: { id: true, workspaceId: true },
  })
  if (!material) throw createError({ statusCode: 404, statusMessage: 'Material not found' })

  const task = await db.task.findUnique({ where: { id }, select: { workspaceId: true } })
  if (task?.workspaceId !== material.workspaceId) {
    throw createError({ statusCode: 422, statusMessage: 'Task and material are in different workspaces' })
  }

  await db.taskMaterial.upsert({
    where: { taskId_materialId: { taskId: id, materialId: material.id } },
    update: {},
    create: { taskId: id, materialId: material.id },
  })
  return { ok: true }
})
