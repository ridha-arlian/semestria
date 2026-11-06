import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { toWorkspace } from '../../../shared/serialize'
import { emptyWorkspaceSummary, summarizeWorkspaces } from '../../utils/workspaceSummary'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)

  const rows = await db.workspace.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
  })

  const summaries = await summarizeWorkspaces(event, rows.map((row) => row.id))
  return rows.map((row) => toWorkspace(row, summaries.get(row.id) ?? emptyWorkspaceSummary()))
})
