import { z } from 'zod'
import { requireFullAccessUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { deleteObject, headObject } from '../../utils/storage'

const bodySchema = z.object({
  key: z.string().min(1).max(500),
})

const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireFullAccessUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'key is required' })

  const key = parsed.data.key
  if (!key.startsWith(`avatars/${user.id}/`))
    throw createError({ statusCode: 422, statusMessage: 'Invalid avatar key' })

  const meta = await headObject(event, key)
  if (!meta)
    throw createError({ statusCode: 422, statusMessage: 'Uploaded avatar not found. Upload it again.' })
  if (meta.contentLength > MAX_BYTES) {
    await deleteObject(event, key).catch(() => {})
    throw createError({ statusCode: 422, statusMessage: 'Avatar must be 2MB or smaller.' })
  }
  if (!AVATAR_MIME.includes(meta.contentType)) {
    await deleteObject(event, key).catch(() => {})
    throw createError({ statusCode: 422, statusMessage: 'Avatar must be a PNG, JPG or WebP image.' })
  }

  const db = useDb(event)
  const before = await db.user.findUnique({ where: { id: user.id }, select: { avatarKey: true } })
  await db.user.update({ where: { id: user.id }, data: { avatarKey: key, avatarHidden: false } })

  if (before?.avatarKey && before.avatarKey !== key)
    await deleteObject(event, before.avatarKey).catch(() => {})

  return { ok: true, key }
})
