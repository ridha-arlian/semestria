/**
 * Only same-origin relative paths are valid post-login targets. Rejects
 * protocol-relative (`//evil`) and control characters that could be used for
 * open redirects or header tricks.
 */
export function safeRedirect(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return fallback
  if (value.includes('\\'))
    return fallback
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code < 0x20 || code === 0x7F)
      return fallback
  }
  return value
}
