import { ownedWorkspaceId } from '../../../../utils/ownership'
import { useDb } from '../../../../utils/db'
import { toMaterial } from '../../../../../shared/serialize'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)
  const query = getQuery(event)
  const type = typeof query.type === 'string' ? query.type : undefined
  const tag = typeof query.tag === 'string' ? query.tag : undefined
  const reviewed = typeof query.reviewed === 'string' ? query.reviewed : undefined
  const q = typeof query.q === 'string' ? query.q : undefined

  const rows = await db.material.findMany({
    where: {
      workspaceId: id,
      ...(type ? { type } : {}),
      ...(tag ? { tags: { some: { tag } } } : {}),
      ...(reviewed === '1' ? { reviewedAt: { not: null } } : reviewed === '0' ? { reviewedAt: null } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      tags: { orderBy: { id: 'asc' } },
      links: { orderBy: { position: 'asc' } },
      tasks: { select: { taskId: true } },
    },
  })

  return rows.map(toMaterial)
})
