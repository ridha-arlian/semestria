import { requireUser } from '../../../../utils/auth'
import { ownedWorkspaceId } from '../../../../utils/ownership'
import { useDb } from '../../../../utils/db'
import { parseOr400, materialScalar } from '../../../../../shared/schemas'
import { toMaterial } from '../../../../../shared/serialize'
import { logActivity } from '../../../../utils/activity'
import { enforceDemoMaterialLimit } from '../../../../utils/demo'
import { isDemoMaterialType } from '../../../../../shared/demo'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)
  const body = parseOr400(materialScalar, await readBody(event))

  if (user.isDemo) {
    await enforceDemoMaterialLimit(db, user.id)
    if (!isDemoMaterialType(body.type))
      throw createError({ statusCode: 403, statusMessage: 'This material type is not available in the demo' })
  }

  if (body.taskId) {
    const task = await db.task.findFirst({ where: { id: body.taskId, workspaceId: id }, select: { id: true } })
    if (!task) throw createError({ statusCode: 422, statusMessage: 'Task does not belong to this workspace' })
  }

  const created = await db.$transaction(async (tx) => {
    const row = await tx.material.create({
      data: {
        workspaceId: id,
        title: body.title,
        course: body.course,
        type: body.type,
        storageProvider: body.url?.trim() ? 'external' : null,
        contentUrl: body.url?.trim() || null,
        tags: body.tags.length ? { create: body.tags.map((tag) => ({ tag })) } : undefined,
      },
    })

    if (body.taskId) {
      await tx.taskMaterial.create({ data: { taskId: body.taskId, materialId: row.id } })
    }

    return tx.material.findUnique({
      where: { id: row.id },
      include: {
        tags: { orderBy: { id: 'asc' } },
        links: { orderBy: { position: 'asc' } },
        tasks: { select: { taskId: true } },
      },
    })
  })

  await logActivity(event, created!.id, user.id, 'Created', 'Created', created!.title)
  return toMaterial(created!)
})
