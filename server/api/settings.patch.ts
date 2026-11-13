import { requireFullAccessUser, setUser } from '../utils/auth'
import { useDb } from '../utils/db'
import { parseOr400, settingsPatch } from '../../shared/schemas'
import { toSettings } from '../../shared/serialize'

export default defineEventHandler(async (event) => {
  const user = await requireFullAccessUser(event)
  const db = useDb(event)
  const body = parseOr400(settingsPatch, await readBody(event))

  const updated = await db.$transaction(async (tx) => {
    if (body.profile) {
      // The client sends the whole settings object, so only a real change to the
      // stored name marks it as user-owned. Email is the login identity: never
      // overwritten from settings.
      const current = await tx.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      })
      if (current && body.profile.name !== undefined && body.profile.name !== current.name) {
        await tx.user.update({
          where: { id: user.id },
          data: { name: body.profile.name, nameCustomized: true },
        })
      }
    }

    if (body.appearance || body.notifications || body.preferences) {
      await tx.userSettings.upsert({
        where: { userId: user.id },
        update: {
          ...(body.appearance ?? {}),
          ...(body.notifications ?? {}),
          ...(body.preferences ?? {}),
        },
        create: { userId: user.id, ...(body.appearance ?? {}), ...(body.notifications ?? {}), ...(body.preferences ?? {}) },
      })
    }

    return tx.user.findUnique({ where: { id: user.id }, include: { settings: true } })
  })

  // Keep the sealed session in step with the rename: otherwise /api/auth/me
  // keeps reporting the old name until the next sign-in.
  if (updated && updated.name !== user.name)
    await setUser(event, { ...user, name: updated.name })

  return toSettings(updated, updated?.settings)
})
