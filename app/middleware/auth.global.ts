// Protects dashboard/workspace pages. The API handlers enforce the same rule
// server-side; this middleware only keeps unauthenticated users off the UI.
// `auth.global.ts` runs before `data.global.ts` (alphabetical), so no cache
// fetch happens before the session is known.
export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  if (path === '/' || path.startsWith('/api/')
    || path.startsWith('/_nuxt/') || path.startsWith('/assets/')) return

  const cache = useState<{ id: string } | null>('auth-user', () => null)
  if (cache.value) return

  const request = useRequestFetch()
  const user = await request<{ id: string } | null>('/api/auth/me').catch(() => null)
  if (!user) {
    return navigateTo({ path: '/', query: { redirect: path } })
  }
  cache.value = user
})
