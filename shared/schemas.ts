import { z } from 'zod'

// Shared input validation for server handlers.

// NOTE: executed on the server only. `createError` is a Nitro global; this
// file must never be imported by client code.

// Forms submit `''` for "not set"; the API treats empty optional strings as
// null so create/edit does not fail validation.
const emptyToNull = <T extends z.ZodType>(schema: T) =>
  z.preprocess(v => (v === '' ? null : v), schema) as unknown as T

const MATERIAL_TYPES = ['Notes', 'Book', 'Slides', 'Collection', 'Link', 'PDF', 'Video'] as const

export const workspaceForm = z.object({
  name: z.string().min(1).max(120),
  startDate: emptyToNull(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  endDate: emptyToNull(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  isActive: z.boolean().default(false),
}).refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
  message: 'startDate must be on or before endDate',
})

export const taskScalar = z.object({
  title: z.string().min(1).max(300),
  course: z.string().min(1).max(200),
  due: emptyToNull(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()), // yyyy-mm-dd
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  description: z.string().max(5000).nullable().optional(),
  submissionUrl: emptyToNull(z.string().url().nullable().optional()),
})

export const taskPatch = z.object({
  title: z.string().min(1).max(300).optional(),
  course: z.string().min(1).max(200).optional(),
  due: emptyToNull(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().max(5000).nullable().optional(),
  note: z.string().max(10000).nullable().optional(),
  status: z.enum(['To do', 'In progress', 'Done']).optional(),
})

export const materialScalar = z.object({
  title: z.string().min(1).max(300),
  course: z.string().min(1).max(200),
  type: z.enum(MATERIAL_TYPES),
  url: emptyToNull(z.string().max(2000).nullable().optional()),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  taskId: z.number().int().positive().nullable().optional(),
})

// PATCH must not inherit `tags: []` from `materialScalar.partial()`: that
// default would clear every tag when the field is omitted.
export const materialPatch = z.object({
  title: z.string().min(1).max(300).optional(),
  course: z.string().min(1).max(200).optional(),
  type: z.enum(MATERIAL_TYPES).optional(),
  url: emptyToNull(z.string().max(2000).nullable().optional()),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
  taskId: z.number().int().positive().nullable().optional(),
})

export const materialContent = z.object({
  url: emptyToNull(z.string().max(2000).nullable()), // R2 object URL or external link; null clears content
  source: z.enum(['file', 'link']).nullable(),
  fileName: z.string().max(255).nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
})

export const materialLink = z.object({
  url: z.string().url().max(2000),
  label: z.string().max(120).nullable().optional(),
})

export const materialNote = z.object({
  note: z.union([z.string().max(100000), z.record(z.string(), z.any())]),
})

export const settingsPatch = z.object({
  profile: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(200),
  }).partial().optional(),
  appearance: z.object({
    preset: z.enum(['mono', 'ocean', 'forest', 'rose', 'amber', 'violet', 'custom']).optional(),
    customColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional(),
  }).partial().optional(),
  notifications: z.object({
    deadlineReminders: z.boolean().optional(),
    leadTime: z.enum(['1', '3', '7']).optional(),
    weeklyDigest: z.boolean().optional(),
    materialUpdates: z.boolean().optional(),
  }).partial().optional(),
  preferences: z.object({
    weekStartsOn: z.enum(['monday', 'sunday']).optional(),
    defaultLanding: z.enum(['dashboard', 'last-active']).optional(),
    activeWorkspaceSlug: z.string().max(120).nullable().optional(),
  }).partial().optional(),
})

export function parseOr400<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })) },
    })
  }
  return result.data
}
