import type { H3Event } from 'h3'

export interface SessionUser {
  id: string
  email: string
  name: string
  picture?: string
}

function sessionConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  return {
    password: config.sessionPassword,
    cookie: {
      name: 'semestria-session',
      maxAge: 60 * 60 * 24 * 7,
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

export async function setUser(event: H3Event, user: SessionUser) {
  const session = await useSession(event, sessionConfig(event))
  session.data.user = user
  await session.update({ user })
}

export async function clearUser(event: H3Event) {
  const session = await useSession(event, sessionConfig(event))
  await session.clear()
}
