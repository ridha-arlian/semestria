import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { deleteObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const row = await db.user.findUnique({ where: { id: user.id }, select: { avatarKey: true } })

  await db.user.update({ where: { id: user.id }, data: { avatarKey: null } })
  if (row?.avatarKey)
    await deleteObject(event, row.avatarKey).catch(() => {})

  return { ok: true }
})
