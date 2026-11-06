import type { Prisma } from '../generated/prisma/client'

export type TaskStatus = 'To do' | 'In progress' | 'Done'

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  'To do': 0,
  'In progress': 50,
  Done: 100,
}

/**
 * Keep a task's checklist, status and progress consistent.
 *
 * With an explicit status, checklist items follow that status. Without one the
 * status is derived from the checklist, which is what add/toggle/remove need.
 */
export async function syncTaskProgress(
  tx: Prisma.TransactionClient,
  taskId: number,
  nextStatus?: TaskStatus,
) {
  const items = await tx.checklistItem.findMany({
    where: { taskId },
    select: { done: true },
  })

  if (!items.length) {
    const status = nextStatus
      ?? ((await tx.task.findUnique({ where: { id: taskId }, select: { status: true } }))?.status as TaskStatus | undefined)
      ?? 'To do'
    await tx.task.update({
      where: { id: taskId },
      data: { status, progress: STATUS_PROGRESS[status] ?? 0 },
    })
    return
  }

  if (nextStatus) {
    if (nextStatus === 'Done' || nextStatus === 'To do') {
      await tx.checklistItem.updateMany({
        where: { taskId },
        data: { done: nextStatus === 'Done' },
      })
    }
    const doneCount = nextStatus === 'Done'
      ? items.length
      : nextStatus === 'To do'
        ? 0
        : items.filter((item) => item.done).length
    await tx.task.update({
      where: { id: taskId },
      data: { status: nextStatus, progress: Math.round((doneCount / items.length) * 100) },
    })
    return
  }

  const doneCount = items.filter((item) => item.done).length
  const status: TaskStatus = doneCount === items.length ? 'Done' : doneCount > 0 ? 'In progress' : 'To do'
  await tx.task.update({
    where: { id: taskId },
    data: { status, progress: Math.round((doneCount / items.length) * 100) },
  })
}
