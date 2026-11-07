import { AwsClient } from 'aws4fetch'
import type { H3Event } from 'h3'
import type { CfEnv } from '../types/cloudflare'
import { cfEnv } from './cf'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

function r2Config(event: H3Event): R2Config {
  const config = useRuntimeConfig(event)
  return {
    accountId: config.r2.accountId,
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
    bucket: config.r2.bucket,
  }
}

function r2Client(event: H3Event): AwsClient {
  const { accountId, accessKeyId, secretAccessKey } = r2Config(event)
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: accountId ? 'auto' : 'us-east-1',
  })
}

function objectUrl(event: H3Event, key: string): string {
  const { accountId, bucket } = r2Config(event)
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`
}

export interface UploadTicket {
  url: string
  method: 'PUT'
  /** Content-Type the browser must send, or the signed URL mismatches. */
  contentType: string
}

/**
 * Presigned PUT straight from the browser to R2. Required because the
 * request body through Workers is limited to 100 MB (Free/Pro zone plans).
 * The server still verifies the real object size after upload.
 */
export async function presignUpload(
  event: H3Event,
  key: string,
  contentType: string,
): Promise<UploadTicket> {
  // `X-Amz-Expires` must be a query parameter before signing. Passing it as a
  // header makes aws4fetch silently fall back to its 86400s default.
  const url = new URL(objectUrl(event, key))
  url.searchParams.set('X-Amz-Expires', '900')

  const signed = await r2Client(event).sign(
    new Request(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    }),
    { aws: { signQuery: true } },
  )
  return { url: signed.url, method: 'PUT', contentType }
}

/** RFC 5987 attachment header; the quoted fallback is stripped of CR/LF/quotes. */
export function attachmentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

export interface ObjectMeta {
  contentLength: number
  contentType: string
  etag: string
}

export async function headObject(event: H3Event, key: string): Promise<ObjectMeta | null> {
  const res = await r2Client(event).fetch(objectUrl(event, key), { method: 'HEAD' })
  if (res.status === 404) return null
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: `R2 HEAD failed: ${res.status}` })
  return {
    contentLength: Number(res.headers.get('content-length') ?? 0),
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    etag: res.headers.get('etag') ?? '',
  }
}

export async function deleteObject(event: H3Event, key: string): Promise<void> {
  const res = await r2Client(event).fetch(objectUrl(event, key), { method: 'DELETE' })
  if (!res.ok && res.status !== 404) {
    throw createError({ statusCode: 502, statusMessage: `R2 DELETE failed: ${res.status}` })
  }
}

/**
 * Server-side upload to R2. Used for images the server fetches itself, such
 * as the Google profile photo. Prefer the binding; fall back to signed S3
 * PUT when the Worker binding is absent in local dev.
 */
export async function putObject(
  event: H3Event,
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const files = event.context.cloudflare?.env?.FILES
  if (files) {
    await files.put(key, body, { httpMetadata: { contentType } })
    return
  }

  const res = await r2Client(event).fetch(objectUrl(event, key), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: body as unknown as BodyInit,
  })
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: `R2 PUT failed: ${res.status}` })
  }
}

/** Fetch responses have immutable headers in local dev; callers add headers. */
function mutableResponse(response: Response): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })
}

/**
 * Stream a stored object back through the Worker so ownership can be checked
 * before bytes leave R2. I/O wait does not consume Worker CPU.
 *
 * Local fallback: when the Cloudflare R2 binding is absent (plain
 * `nuxt dev` without the cloudflare preset / workerd), fetch directly
 * from the public R2 S3 endpoint with the same credentials used for
 * presigning. Ownership was already verified by the caller.
 */
export async function getObject(event: H3Event, key: string, range?: string | null): Promise<Response | null> {
  // R2 accepts a Headers object for `range`; a raw header string is not a
  // valid R2Range. The binding returns the slice in `obj.range`.
  // Do not set `onlyIf`: a failed precondition returns an R2Object without a
  // body, which would become an empty 200 response.
  const options: Record<string, unknown> = {}
  if (range) options.range = new Headers({ range })

  let obj: Awaited<ReturnType<CfEnv['FILES']['get']>> | null
  try {
    obj = await cfEnv(event).FILES.get(key, options)
  } catch {
    // No workerd binding in local dev: fall through to S3 fetch below.
    const headers: Record<string, string> = {}
    if (range) headers.Range = range
    const res = await r2Client(event).fetch(objectUrl(event, key), { method: 'GET', headers })
    if (res.status === 404) return null
    if (res.status === 416) return mutableResponse(res)
    if (!res.ok && res.status !== 206) {
      throw createError({ statusCode: 502, statusMessage: `R2 GET failed: ${res.status}` })
    }
    return mutableResponse(res)
  }
  if (!obj) return null

  const headers = new Headers({
    'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
    'Content-Length': String(obj.size),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=0',
  })

  // A ranged GET returns only the requested slice. Report 206 with the real
  // length so media seeking does not truncate or hang.
  const slice = obj.range as { offset?: number, length?: number, suffix?: number } | undefined
  let status = 200
  if (slice) {
    const total = Number(obj.size)
    const offset = slice.suffix !== undefined ? Math.max(total - slice.suffix, 0) : slice.offset ?? 0
    const length = slice.suffix !== undefined
      ? Math.min(slice.suffix, total)
      : slice.length ?? Math.max(total - offset, 0)
    status = 206
    headers.set('Content-Length', String(length))
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${total}`)
  }

  return new Response(obj.body, { status, headers })
}

/** Hard limits per material type. Kept in one place so client and server agree. */
export const FILE_RULES: Record<string, { extensions: string[]; maxMb: number; mime: string[] }> = {
  PDF: { extensions: ['pdf'], maxMb: 20, mime: ['application/pdf'] },
  Slides: { extensions: ['ppt', 'pptx', 'pdf', 'key'], maxMb: 20, mime: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/x-iwork-keynote-sffkey', 'application/x-apple-keynote'] },
  Book: { extensions: ['pdf', 'epub'], maxMb: 50, mime: ['application/pdf', 'application/epub+zip'] },
  Video: { extensions: ['mp4', 'webm', 'mov'], maxMb: 200, mime: ['video/mp4', 'video/webm', 'video/quicktime'] },
}

export function validateFile(name: string, size: number, mime: string, type: string): string | null {
  const rules = FILE_RULES[type]
  if (!rules) return `Uploads are not supported for type "${type}".`
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (!rules.extensions.includes(ext)) return `"${name}" isn't supported. Choose a file of type ${rules.extensions.join(', ')}.`
  if (size > rules.maxMb * 1024 * 1024) return `"${name}" is larger than ${rules.maxMb} MB.`
  if (mime && rules.mime.length && !rules.mime.includes(mime)) return `"${name}" has an unsupported content type (${mime}).`
  return null
}
