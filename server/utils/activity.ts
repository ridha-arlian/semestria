import type { H3Event } from 'h3'
import { useDb } from './db'

export type ActivityKind =
  | 'Created' | 'Note updated' | 'File replaced' | 'File removed'
  | 'Link added' | 'Link updated' | 'Link removed' | 'Content removed'
  | 'Marked reviewed' | 'Tag added' | 'Task linked' | 'Task unlinked' | 'Edited'

export async function logActivity(
  event: H3Event,
  materialId: number,
  actorId: string | null,
  kind: ActivityKind,
  label: string,
  detail?: string,
) {
  const db = useDb(event)
  await db.activity.create({
    data: { materialId, actorId, kind, label, detail: detail ?? null },
  })
}
