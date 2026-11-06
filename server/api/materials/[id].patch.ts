import { requireUser } from '../../utils/auth'
import { ownedMaterialId } from '../../utils/ownership'
import { useDb } from '../../utils/db'
import { parseOr400, materialPatch } from '../../../shared/schemas'
import { toMaterial } from '../../../shared/serialize'
import { logActivity } from '../../utils/activity'
import { deleteObject } from '../../utils/storage'
import { planTypeChange } from '../../../shared/materialPlan'
import type { MaterialType } from '~/types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  await ownedMaterialId(event, id)
  const db = useDb(event)
  const body = parseOr400(materialPatch, await readBody(event))

  const before = await db.material.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { id: 'asc' } },
      links: { orderBy: { position: 'asc' } },
      tasks: { select: { taskId: true } },
    },
  })
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Material not found' })
  const prevType = before.type as MaterialType

  if (body.taskId) {
    const task = await db.task.findFirst({
      where: { id: body.taskId, workspace: { userId: user.id } },
      select: { workspaceId: true },
    })
    if (!task || task.workspaceId !== before.workspaceId)
      throw createError({ statusCode: 422, statusMessage: 'Task does not belong to this workspace' })
  }

  // Type change policy (shared/materialPlan.ts mirrors app/utils/materialContent.ts).
  let contentPatch: Record<string, unknown> = {}
  let linkAction: 'keep' | 'clear' | 'move-url' = 'keep'
  let linksLost = false
  let contentLost = false
  if (body.type && body.type !== before.type) {
    // Collection content lives in links, so its first link stands in for `url`.
    const collectionUrl = before.links[0]?.url
    const planUrl = before.storageProvider === 'external'
      ? before.contentUrl ?? undefined
      : before.storageProvider === 'r2'
        ? before.storageKey ?? undefined
        : collectionUrl
    const planSource = before.storageProvider === 'external'
      ? 'link'
      : before.storageProvider === 'r2'
        ? 'file'
        : collectionUrl
          ? 'link'
          : undefined

    const plan = planTypeChange(
      {
        type: prevType,
        url: planUrl,
        source: planSource,
        fileName: before.fileName ?? undefined,
        fileSize: before.fileSize ?? undefined,
      },
      prevType,
      body.type,
    )
    contentPatch = {
      storageProvider: plan.source === 'link' ? 'external' : plan.source === 'file' ? 'r2' : null,
      contentUrl: plan.source === 'link' ? plan.url || null : null,
      storageKey: plan.source === 'file' ? plan.url || null : null,
      fileName: plan.fileName ?? null,
      fileSize: plan.fileSize ?? null,
    }

    // Every transition drops collection links except Link/Video → Collection,
    // which keeps the old link as the first collection entry.
    const moveToCollection = body.type === 'Collection'
      && (before.type === 'Link' || (before.type === 'Video' && before.storageProvider === 'external'))
      && !!planUrl
      && before.links.length === 0
    linkAction = moveToCollection ? 'move-url' : 'clear'
    // Collection → Link/Video keeps its first link as the new target.
    const keepsFirstLink = before.type === 'Collection'
      && (body.type === 'Link' || body.type === 'Video')
      && !!plan.url
    linksLost = before.links.length > (keepsFirstLink ? 1 : 0)
    contentLost = plan.lost || linksLost
  }

  const prevTags = before.tags.map((t) => t.tag).join(', ')
  const prevTaskId = before.tasks[0]?.taskId ?? null
  const prevStorageKey = before.storageProvider === 'r2' ? before.storageKey : null

  const updated = await db.$transaction(async (tx) => {
    if (body.tags) {
      await tx.materialTag.deleteMany({ where: { materialId: id } })
      if (body.tags.length) {
        await tx.materialTag.createMany({ data: body.tags.map((tag) => ({ materialId: id, tag })) })
      }
    }

    if (body.taskId !== undefined) {
      await tx.taskMaterial.deleteMany({ where: { materialId: id } })
      if (body.taskId) {
        await tx.taskMaterial.create({ data: { taskId: body.taskId, materialId: id } })
      }
    }

    if (linkAction === 'clear') {
      await tx.materialLink.deleteMany({ where: { materialId: id } })
    }
    else if (linkAction === 'move-url') {
      await tx.materialLink.create({
        data: { materialId: id, url: before.contentUrl!, position: 0 },
      })
    }

    return tx.material.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.course !== undefined ? { course: body.course } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...contentPatch,
      },
      include: {
        tags: { orderBy: { id: 'asc' } },
        links: { orderBy: { position: 'asc' } },
        tasks: { select: { taskId: true } },
      },
    })
  })

  // Type change may drop or replace the stored object; remove the old one.
  const nextStorageKey = updated.storageProvider === 'r2' ? updated.storageKey : null
  if (prevStorageKey && prevStorageKey !== nextStorageKey)
    await deleteObject(event, prevStorageKey).catch(() => {})

  const nextTags = updated.tags.map((t) => t.tag).join(', ')
  if (prevTags !== nextTags) {
    await logActivity(event, id, user.id, 'Tag added', 'Tag added', nextTags || undefined)
  } else {
    await logActivity(event, id, user.id, 'Edited', 'Edited')
  }
  if (linksLost) {
    await logActivity(event, id, user.id, 'Content removed', 'Content removed')
  } else if (linkAction === 'move-url') {
    await logActivity(event, id, user.id, 'Link added', 'Link added', before.contentUrl ?? undefined)
  } else if (contentLost) {
    await logActivity(event, id, user.id, 'Content removed', 'Content removed')
  }
  if (body.taskId !== undefined && body.taskId !== prevTaskId) {
    await logActivity(event, id, user.id, body.taskId ? 'Task linked' : 'Task unlinked', body.taskId ? 'Task linked' : 'Task unlinked')
  }

  return toMaterial(updated)
})
