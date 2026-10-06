export default defineNuxtRouteMiddleware((to) => {
  const workspace = useApi().getWorkspaceBySlug(to.params.slug as string)

  if (!workspace) {
    return abortNavigation(
      createError({ statusCode: 404, statusMessage: 'Workspace tidak ditemukan' }),
    )
  }
})