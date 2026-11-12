import { z } from 'zod'
import { requireFullAccessUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { presignUpload, validateFile } from '../../../utils/storage'

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(500 * 1024 * 1024),
  contentType: z.string().min(1).max(127),
})

export default defineEventHandler(async (event) => {
  const user = await requireFullAccessUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'fileName, fileSize and contentType are required' })

  const db = useDb(event)
  const material = await db.material.findUnique({ where: { id }, select: { type: true } })
  if (!material) throw createError({ statusCode: 404, statusMessage: 'Material not found' })

  const problem = validateFile(parsed.data.fileName, parsed.data.fileSize, parsed.data.contentType, material.type)
  if (problem) throw createError({ statusCode: 422, statusMessage: problem })

  // Server-generated key: never trust a client-supplied path.
  const key = `${user.id}/${id}/${Date.now()}-${parsed.data.fileName.replace(/[^\w.\-]+/g, '_')}`
  const ticket = await presignUpload(event, key, parsed.data.contentType)
  return { ...ticket, key }
})
