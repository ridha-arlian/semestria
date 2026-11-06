import { ownedWorkspaceId } from '../../../../utils/ownership'
import { useDb } from '../../../../utils/db'
import { toTask } from '../../../../../shared/serialize'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  const priority = typeof query.priority === 'string' ? query.priority : undefined
  const course = typeof query.course === 'string' ? query.course : undefined
  const q = typeof query.q === 'string' ? query.q : undefined

  const rows = await db.task.findMany({
    where: {
      workspaceId: id,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(course ? { course } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      checklist: { orderBy: { position: 'asc' } },
      submissions: { orderBy: { position: 'asc' } },
      materials: { select: { materialId: true } },
    },
  })

  return rows.map(toTask)
})
