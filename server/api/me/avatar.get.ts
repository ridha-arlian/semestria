import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { getObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const row = await db.user.findUnique({ where: { id: user.id }, select: { avatarKey: true } })
  if (!row?.avatarKey) throw createError({ statusCode: 404, statusMessage: 'No avatar' })

  const response = await getObject(event, row.avatarKey, getHeader(event, 'range') ?? undefined)
  if (!response) throw createError({ statusCode: 404, statusMessage: 'No avatar' })
  // Private: a shared cache must never serve one user's avatar to another.
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
})
