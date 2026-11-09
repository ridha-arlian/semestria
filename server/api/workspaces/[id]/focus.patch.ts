import { useDb } from '../../../utils/db'
import { ownedWorkspaceId } from '../../../utils/ownership'
import { parseOr400, workspaceFocus } from '../../../../shared/schemas'
import { toWorkspace } from '../../../../shared/serialize'
import { summarizeWorkspace } from '../../../utils/workspaceSummary'

function focusRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedWorkspaceId(event, id)
  const body = parseOr400(workspaceFocus, await readBody(event))
  const db = useDb(event)

  const current = await db.workspace.findUnique({ where: { id }, select: { focusNotes: true } })
  const notes = focusRecord(current?.focusNotes)
  const key = String(body.week)
  const note = body.note.trim()
  const { [key]: _previous, ...withoutKey } = notes
  const nextNotes = note ? { ...withoutKey, [key]: note } : withoutKey

  const updated = await db.workspace.update({
    where: { id },
    data: { focusNotes: nextNotes },
  })

  const summary = await summarizeWorkspace(event, id)
  return toWorkspace(updated, summary)
})
