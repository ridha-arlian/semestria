import { getUser, setUser } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { googleAvatarKey, importGoogleAvatar } from '../../utils/googleAvatar'
import { safeRedirect } from '../../utils/redirect'

interface GoogleTokenResponse {
  access_token: string
  id_token?: string
  error?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const expected = getCookie(event, 'oauth-state')

  if (!code || !state || !expected || state !== expected) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
  }

  const config = useRuntimeConfig(event)
  const clientId = config.oauth.google.clientId
  const clientSecret = config.oauth.google.clientSecret
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth is not configured' })
  }

  const origin = new URL(getRequestURL(event).origin)
  const redirectUri = `${origin.origin}/api/auth/google-callback`

  const tokenRes = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  }).catch(() => null)

  if (!tokenRes?.access_token) {
    throw createError({ statusCode: 400, statusMessage: 'OAuth token exchange failed' })
  }

  const info = await $fetch<GoogleUserInfo>('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` },
  }).catch(() => null)

  if (!info?.sub || !info.email) {
    throw createError({ statusCode: 400, statusMessage: 'Failed to load Google profile' })
  }
  if (info.email_verified !== true) {
    throw createError({ statusCode: 403, statusMessage: 'Google account email is not verified' })
  }

  const db = useDb(event)
  const user = await db.user.upsert({
    where: { email: info.email },
    update: { name: info.name ?? info.email },
    create: { email: info.email, name: info.name ?? info.email },
    include: { settings: true },
  })

  if (!user.settings) {
    await db.userSettings.create({ data: { userId: user.id } })
  }

  // Import the Google photo only while the user has not chosen an avatar.
  // A deterministic key marks imported photos, so a changed Google photo can
  // refresh without overwriting a custom upload.
  let avatarKey = user.avatarKey
  const canImport = !user.avatarHidden
    && (!avatarKey || avatarKey === googleAvatarKey(user.id))
  if (canImport && info.picture) {
    const imported = await importGoogleAvatar(event, user.id, info.picture)
    if (imported && imported !== avatarKey) {
      avatarKey = imported
      await db.user.update({ where: { id: user.id }, data: { avatarKey } })
    }
  }

  // Signing in ends the sandbox: drop the disposable demo account instead of
  // waiting for the 7-day cleanup. Cascades remove its workspace and content.
  const demo = await getUser(event)
  if (demo?.isDemo && demo.id !== user.id) {
    await db.user.delete({ where: { id: demo.id } }).catch(() => {})
  }

  await setUser(event, {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: info.picture,
  })

  const destination = safeRedirect(getCookie(event, 'oauth-redirect'))
  deleteCookie(event, 'oauth-state', { path: '/api/auth/google-callback' })
  deleteCookie(event, 'oauth-redirect', { path: '/api/auth/google-callback' })
  return sendRedirect(event, destination, 302)
})
