import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { importGoogleAvatar } from '../../utils/googleAvatar'
import { getObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { avatarKey: true, avatarHidden: true },
  })

  // Existing sessions predate the import-at-login flow. Bootstrap the Google
  // photo once, unless the user explicitly removed their avatar.
  let avatarKey = row?.avatarKey ?? null
  if (!avatarKey && row && !row.avatarHidden && user.picture) {
    avatarKey = await importGoogleAvatar(event, user.id, user.picture)
    if (avatarKey) {
      await db.user.update({ where: { id: user.id }, data: { avatarKey } })
    }
  }

  if (!avatarKey) throw createError({ statusCode: 404, statusMessage: 'No avatar' })

  const response = await getObject(event, avatarKey, getHeader(event, 'range') ?? undefined)
  if (!response) throw createError({ statusCode: 404, statusMessage: 'No avatar' })
  // Private: a shared cache must never serve one user's avatar to another.
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
})
