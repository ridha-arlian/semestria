import { z } from 'zod'
import { requireFullAccessUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { LEGAL_VERSION } from '../../../shared/legal'

const bodySchema = z.object({
  version: z.string().min(1).max(32),
})

export default defineEventHandler(async (event) => {
  const user = await requireFullAccessUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'version is required' })

  if (parsed.data.version !== LEGAL_VERSION)
    throw createError({ statusCode: 409, statusMessage: 'This document version is no longer current. Reload the page.' })

  const db = useDb(event)
  const updated = await db.user.update({
    where: { id: user.id },
    data: { termsVersion: LEGAL_VERSION, termsAcceptedAt: new Date() },
    select: { termsVersion: true, termsAcceptedAt: true },
  })

  return {
    version: LEGAL_VERSION,
    acceptedVersion: updated.termsVersion,
    acceptedAt: updated.termsAcceptedAt,
    needsConsent: false,
  }
})
