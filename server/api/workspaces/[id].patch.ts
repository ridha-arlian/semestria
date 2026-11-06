import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { parseOr400, workspaceForm } from '../../../shared/schemas'
import { toWorkspace } from '../../../shared/serialize'
import { summarizeWorkspace } from '../../utils/workspaceSummary'
import { ownedWorkspaceId } from '../../utils/ownership'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const body = parseOr400(workspaceForm, await readBody(event))

  const updated = await db.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.workspace.updateMany({ where: { userId: user.id, isActive: true, id: { not: id } }, data: { isActive: false } })
    }
    return tx.workspace.update({
      where: { id },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(`${body.startDate}T00:00:00Z`) : null,
        endDate: body.endDate ? new Date(`${body.endDate}T00:00:00Z`) : null,
        isActive: body.isActive,
      },
    })
  })

  const summary = await summarizeWorkspace(event, updated.id)
  return toWorkspace(updated, summary)
})
