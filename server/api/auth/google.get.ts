import { randomUUID } from 'node:crypto'
import { safeRedirect } from '../../utils/redirect'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const clientId = config.oauth.google.clientId
  if (!clientId) {
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth is not configured' })
  }

  const origin = new URL(getRequestURL(event).origin)
  const redirectUri = `${origin.origin}/api/auth/google-callback`
  const state = randomUUID()
  const secure = origin.protocol === 'https:'

  // Short-lived state cookie, verified on callback.
  setCookie(event, 'oauth-state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth/google-callback',
    maxAge: 600,
    secure,
  })

  // Post-login destination, validated again on callback.
  setCookie(event, 'oauth-redirect', safeRedirect(getQuery(event).redirect), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth/google-callback',
    maxAge: 600,
    secure,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  })

  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302)
})
