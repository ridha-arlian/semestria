import { clearUser, requireFullAccessUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { deleteObject } from '../../utils/storage'

/**
 * Deletes the signed-in account and everything that hangs off it.
 *
 * R2 objects are removed explicitly because database cascades cannot reach
 * storage. A failed object delete is logged and skipped: leaving an orphan
 * object is better than keeping the account alive after the user asked for
 * deletion. Object keys are user-scoped, so no other account is touched.
 */
export default defineEventHandler(async (event) => {
  const user = await requireFullAccessUser(event)
  const db = useDb(event)

  const [materials, profile] = await Promise.all([
    db.material.findMany({
      where: { workspace: { userId: user.id }, storageKey: { not: null } },
      select: { storageKey: true },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { avatarKey: true },
    }),
  ])

  const keys = materials
    .map(material => material.storageKey)
    .filter((key): key is string => Boolean(key))
  if (profile?.avatarKey)
    keys.push(profile.avatarKey)

  await Promise.all(keys.map(key =>
    deleteObject(event, key).catch((error) => {
      console.error('Account deletion: could not delete R2 object', key, error)
    }),
  ))

  // Cascades remove settings, workspaces, tasks, materials, activities, and
  // the avatar key with the user row.
  await db.user.delete({ where: { id: user.id } })
  await clearUser(event)

  return { ok: true }
})
