import type { H3Event } from 'h3'
import { putObject } from './storage'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const GOOGLE_HOST = 'googleusercontent.com'

/** Stable key so re-imports replace the previous Google photo, not stack up. */
export function googleAvatarKey(userId: string): string {
  return `avatars/${userId}/google-profile`
}

function isGooglePicture(url: URL): boolean {
  return url.protocol === 'https:'
    && (url.hostname === GOOGLE_HOST || url.hostname.endsWith(`.${GOOGLE_HOST}`))
}

/** Google serves the profile photo at a requested size via `=sNNN-c`. */
function largerGooglePicture(url: URL): string {
  const next = new URL(url.toString())
  next.pathname = next.pathname.replace(/=s\d+(?:-c)?$/, '=s512-c')
  return next.toString()
}

/**
 * Download the Google profile photo and store it in R2. Returns the avatar
 * key on success. Never throws: a failed photo import must not block login.
 */
export async function importGoogleAvatar(
  event: H3Event,
  userId: string,
  picture: string,
): Promise<string | null> {
  try {
    const source = new URL(picture)
    if (!isGooglePicture(source)) return null

    const res = await $fetch.raw(largerGooglePicture(source), {
      responseType: 'arrayBuffer',
      redirect: 'manual',
      timeout: 5000,
      headers: { Accept: 'image/jpeg,image/png,image/webp' },
    }).catch(() => null)

    if (!res || res.status < 200 || res.status >= 300) return null

    const contentType = (res.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
    if (!ALLOWED_TYPES.has(contentType)) return null

    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > MAX_BYTES) return null

    const body = new Uint8Array(res._data as ArrayBuffer)
    if (!body.byteLength || body.byteLength > MAX_BYTES) return null

    const key = googleAvatarKey(userId)
    await putObject(event, key, body, contentType)
    return key
  }
  catch (error) {
    console.warn('Google avatar import failed:', error)
    return null
  }
}
