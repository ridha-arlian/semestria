import { requireUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { ownedWorkspaceId } from '../../../utils/ownership'
import { toWorkspace } from '../../../../shared/serialize'
import { summarizeWorkspace } from '../../../utils/workspaceSummary'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const db = useDb(event)

  const updated = await db.$transaction(async (tx) => {
    await tx.workspace.updateMany({ where: { userId: user.id, isActive: true, id: { not: id } }, data: { isActive: false } })
    return tx.workspace.update({ where: { id }, data: { isActive: true } })
  })

  const summary = await summarizeWorkspace(event, updated.id)
  return toWorkspace(updated, summary)
})
