import { useErrorCache } from '~/composables/apiCache'

export default defineNuxtRouteMiddleware((to) => {
  const workspace = useApi().getWorkspaceByPublicId(to.params.workspacePublicId as string)
  if (workspace) return

  // A failed workspace list is not proof that the id is wrong: a 404 here
  // would hide a network or server failure behind "Workspace not found".
  if (useErrorCache().value.workspaces) {
    return abortNavigation(
      createError({ statusCode: 503, statusMessage: 'Could not load workspace' }),
    )
  }

  return abortNavigation(
    createError({ statusCode: 404, statusMessage: 'Workspace not found' }),
  )
})