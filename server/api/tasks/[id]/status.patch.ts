import { ownedTaskId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { parseOr400, taskPatch } from '../../../../shared/schemas'
import { toTask } from '../../../../shared/serialize'
import { syncTaskProgress } from '../../../utils/taskProgress'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedTaskId(event, id)
  const db = useDb(event)
  const body = parseOr400(taskPatch.pick({ status: true }), await readBody(event))
  if (!body.status) throw createError({ statusCode: 400, statusMessage: 'status is required' })

  const updated = await db.$transaction(async (tx) => {
    await syncTaskProgress(tx, id, body.status)
    return tx.task.findUnique({
      where: { id },
      include: {
        checklist: { orderBy: { position: 'asc' } },
        submissions: { orderBy: { position: 'asc' } },
        materials: { select: { materialId: true } },
      },
    })
  })

  return toTask(updated!)
})
