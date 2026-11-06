import { requireUser } from '../utils/auth'
import { useDb } from '../utils/db'
import { parseOr400, settingsPatch } from '../../shared/schemas'
import { toSettings } from '../../shared/serialize'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDb(event)
  const body = parseOr400(settingsPatch, await readBody(event))

  const updated = await db.$transaction(async (tx) => {
    if (body.profile) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(body.profile.name !== undefined ? { name: body.profile.name } : {}),
          // Email is the login identity: never overwritten from settings.
        },
      })
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

  return toSettings(updated, updated?.settings)
})
