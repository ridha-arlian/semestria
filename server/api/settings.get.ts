import { requireUser } from '../utils/auth'
import { useDb } from '../utils/db'
import { toSettings } from '../../shared/serialize'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const row = await db.user.findUnique({
    where: { id: user.id },
    include: { settings: true },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Server is the source of truth for identity; localStorage only caches.
  return toSettings(row, row.settings)
})
