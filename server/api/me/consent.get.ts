import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { LEGAL_VERSION } from '../../../shared/legal'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  // Demo accounts never accept the terms; the sandbox is disposable.
  if (user.isDemo) {
    return {
      version: LEGAL_VERSION,
      acceptedVersion: LEGAL_VERSION,
      acceptedAt: null,
      needsConsent: false,
    }
  }

  const db = useDb(event)
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { termsVersion: true, termsAcceptedAt: true },
  })

  return {
    version: LEGAL_VERSION,
    acceptedVersion: row?.termsVersion ?? null,
    acceptedAt: row?.termsAcceptedAt ?? null,
    needsConsent: row?.termsVersion !== LEGAL_VERSION,
  }
})
