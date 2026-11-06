import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { parseOr400, workspaceForm } from '../../../shared/schemas'
import { toWorkspace } from '../../../shared/serialize'
import { summarizeWorkspace } from '../../utils/workspaceSummary'

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const body = parseOr400(workspaceForm, await readBody(event))

  const base = slugify(body.name) || 'workspace'
  let slug = base
  let suffix = 2
  while (await db.workspace.findFirst({ where: { userId: user.id, slug }, select: { id: true } })) {
    slug = `${base}-${suffix++}`
  }

  const created = await db.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.workspace.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } })
    }
    return tx.workspace.create({
      data: {
        userId: user.id,
        name: body.name,
        slug,
        startDate: body.startDate ? new Date(`${body.startDate}T00:00:00Z`) : null,
        endDate: body.endDate ? new Date(`${body.endDate}T00:00:00Z`) : null,
        isActive: body.isActive,
      },
    })
  })

  const summary = await summarizeWorkspace(event, created.id)
  return toWorkspace(created, summary)
})
