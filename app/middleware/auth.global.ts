// Protects dashboard/workspace pages. The API handlers enforce the same rule
// server-side; this middleware only keeps unauthenticated users off the UI.
// `auth.global.ts` runs before `data.global.ts` (alphabetical), so no cache
// fetch happens before the session is known.
import type { AuthUser } from '~/composables/useAuthUser'

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  if (isPublicRoute(path) || path.startsWith('/api/')
    || path.startsWith('/_nuxt/') || path.startsWith('/assets/')) return

  const user = useAuthUser()
  if (user.value) return

  const request = useRequestFetch()
  const nextUser = await request<AuthUser | null>('/api/auth/me').catch(() => null)
  if (!nextUser) {
    return navigateTo({ path: '/', query: { redirect: path } })
  }
  user.value = nextUser
})
