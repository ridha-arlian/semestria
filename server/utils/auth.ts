import type { H3Event } from 'h3'

export interface SessionUser {
  id: string
  email: string
  name: string
  picture?: string
  /** Disposable visitor created by the landing-page demo button. */
  isDemo?: boolean
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7
/** Demo sessions expire after a day; the rows stay until cleanup. */
export const DEMO_SESSION_MAX_AGE = 60 * 60 * 24

function sessionConfig(event: H3Event, maxAge = SESSION_MAX_AGE) {
  const config = useRuntimeConfig(event)
  return {
    password: config.sessionPassword,
    cookie: {
      name: 'semestria-session',
      maxAge,
      sameSite: 'lax' as const,
      secure: getRequestURL(event).protocol === 'https:',
    },
  }
}

export async function getUser(event: H3Event): Promise<SessionUser | null> {
  const session = await useSession(event, sessionConfig(event))
  return (session.data.user as SessionUser | undefined) ?? null
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

/** Reject demo accounts on features the sandbox does not offer. */
export function requireFullAccess(user: SessionUser): void {
  if (user.isDemo) {
    throw createError({ statusCode: 403, statusMessage: 'Not available in demo' })
  }
}

export async function requireFullAccessUser(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event)
  requireFullAccess(user)
  return user
}

export async function setUser(
  event: H3Event,
  user: SessionUser,
  options: { demo?: boolean } = {},
) {
  const session = await useSession(
    event,
    sessionConfig(event, options.demo ? DEMO_SESSION_MAX_AGE : SESSION_MAX_AGE),
  )
  session.data.user = user
  await session.update({ user })
}

export async function clearUser(event: H3Event) {
  const session = await useSession(event, sessionConfig(event))
  await session.clear()
}
