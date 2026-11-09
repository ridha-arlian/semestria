import { requireUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { toWorkspace } from '../../../../shared/serialize'
import { summarizeWorkspace } from '../../../utils/workspaceSummary'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const slug = getRouterParam(event, 'slug') as string

  const row = await db.workspace.findFirst({ where: { userId: user.id, slug } })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Workspace not found' })

  const summary = await summarizeWorkspace(event, row.id)
  return toWorkspace(row, summary)
})
