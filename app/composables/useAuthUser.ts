export interface AuthUser {
  id: string
  email?: string
  name?: string
  picture?: string
  /** True when the session belongs to the disposable landing-page sandbox. */
  isDemo?: boolean
}

/** Session identity shared by auth.global, the landing header, and layouts. */
export function useAuthUser() {
  return useState<AuthUser | null>('auth-user', () => null)
}

export function useDemo() {
  const authUser = useAuthUser()
  const isDemo = computed(() => authUser.value?.isDemo === true)
  return { authUser, isDemo }
}
