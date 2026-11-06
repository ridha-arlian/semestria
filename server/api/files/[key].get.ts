import { requireUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { attachmentDisposition, getObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const key = decodeURIComponent(getRouterParam(event, 'key') as string)
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  // Ownership: the key must belong to a material owned by the caller.
  const user = await requireUser(event)
  const db = useDb(event)
  const material = await db.material.findFirst({
    where: { storageKey: key, workspace: { userId: user.id } },
    select: { id: true, fileName: true },
  })
  if (!material) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  const range = getHeader(event, 'range') ?? undefined
  const response = await getObject(event, key, range)
  if (!response) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  if (material.fileName)
    response.headers.set('Content-Disposition', attachmentDisposition(material.fileName))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
})
