import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { requireUser } from '../../utils/auth'
import { presignUpload } from '../../utils/storage'

const bodySchema = z.object({
  fileName: z.string().min(1).max(120),
  fileSize: z.number().int().positive().max(2 * 1024 * 1024),
  contentType: z.string().min(1).max(127),
})

// Extension and MIME must agree. SVG is deliberately absent: it can execute
// script when served inline.
const AVATAR_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid avatar payload' })

  const { fileName, contentType } = parsed.data
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (!(ext in AVATAR_TYPES) || AVATAR_TYPES[ext] !== contentType) {
    throw createError({ statusCode: 422, statusMessage: 'Avatar must be a PNG, JPG or WebP image.' })
  }

  const key = `avatars/${user.id}/${randomUUID()}-${fileName.replace(/[^\w.\-]+/g, '_')}`
  const ticket = await presignUpload(event, key, contentType)

  // Do not write `avatarKey` yet: the object does not exist until the client
  // PUTs it. `PATCH /api/me/avatar` verifies and commits it.
  return { ...ticket, key }
})
