// Shared demo limits. Imported by server guards and client UI so both agree on
// what the sandbox allows. Pure constants: no runtime imports.

export const DEMO_TASK_LIMIT = 10
export const DEMO_MATERIAL_LIMIT = 10
export const DEMO_MAX_ACTIVE_USERS = 200
export const DEMO_STARTS_PER_HOUR = 5
export const DEMO_RETENTION_DAYS = 7

/** Material types a visitor can create. Seeded types stay readable. */
export const DEMO_MATERIAL_TYPES = ['Notes', 'Link'] as const

export function isDemoMaterialType(type: string): boolean {
  return (DEMO_MATERIAL_TYPES as readonly string[]).includes(type)
}

export const DEMO_SIGN_IN_HREF = '/api/auth/google?redirect=%2Fdashboard'
