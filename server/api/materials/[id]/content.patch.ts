import { requireUser } from '../../../utils/auth'
import { ownedMaterialId } from '../../../utils/ownership'
import { useDb } from '../../../utils/db'
import { parseOr400, materialContent } from '../../../../shared/schemas'
import { toMaterial } from '../../../../shared/serialize'
import { logActivity } from '../../../utils/activity'
import { headObject, deleteObject, validateFile } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const body = parseOr400(materialContent, await readBody(event))

  const before = await db.material.findUnique({ where: { id } })
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Material not found' })

  // Clearing content
  if (!body.url) {
    if (before.storageProvider === 'r2' && before.storageKey) {
      await deleteObject(event, before.storageKey).catch(() => {})
    }
    const updated = await db.material.update({
      where: { id },
      data: { storageProvider: null, storageKey: null, contentUrl: null, contentType: null, fileName: null, fileSize: null },
      include: {
        tags: { orderBy: { id: 'asc' } },
        links: { orderBy: { position: 'asc' } },
        tasks: { select: { taskId: true } },
      },
    })
    await logActivity(event, id, user.id, 'Content removed', 'Content removed')
    return toMaterial(updated)
  }

  if (body.source === 'link') {
    const updated = await db.material.update({
      where: { id },
      data: {
        storageProvider: 'external',
        contentUrl: body.url,
        storageKey: null,
        contentType: null,
        fileName: null,
        fileSize: null,
      },
      include: {
        tags: { orderBy: { id: 'asc' } },
        links: { orderBy: { position: 'asc' } },
        tasks: { select: { taskId: true } },
      },
    })
    // Replacing a file with an external link drops the row's key; remove the
    // now-unreferenced object too.
    if (before.storageProvider === 'r2' && before.storageKey)
      await deleteObject(event, before.storageKey).catch(() => {})
    await logActivity(event, id, user.id, 'Link updated', 'Link updated', body.url)
    return toMaterial(updated)
  }

  // File path: body.url is the R2 object key issued by upload-url.
  const key = body.url
  if (body.source !== 'file')
    throw createError({ statusCode: 400, statusMessage: 'source must be "file"' })

  // Never trust a client-supplied key: it must live under this user/material.
  if (!key.startsWith(`${user.id}/${id}/`))
    throw createError({ statusCode: 422, statusMessage: 'Invalid upload key' })

  const meta = await headObject(event, key)
  if (!meta) throw createError({ statusCode: 422, statusMessage: 'Uploaded object not found. Upload the file again.' })

  const fileName = body.fileName ?? key.split('/').pop() ?? 'file'
  const problem = validateFile(fileName, meta.contentLength, meta.contentType, before.type)
  if (problem) {
    await deleteObject(event, key).catch(() => {})
    throw createError({ statusCode: 422, statusMessage: problem })
  }

  if (before.storageProvider === 'r2' && before.storageKey && before.storageKey !== key) {
    await deleteObject(event, before.storageKey).catch(() => {})
  }

  const updated = await db.material.update({
    where: { id },
    data: {
      storageProvider: 'r2',
      storageKey: key,
      contentUrl: null,
      contentType: meta.contentType,
      fileName,
      fileSize: meta.contentLength,
    },
    include: {
      tags: { orderBy: { id: 'asc' } },
      links: { orderBy: { position: 'asc' } },
      tasks: { select: { taskId: true } },
    },
  })

  await logActivity(event, id, user.id, 'File replaced', 'File replaced', fileName)
  return toMaterial(updated)
})
