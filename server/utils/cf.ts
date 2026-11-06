import type { H3Event } from 'h3'
import type { CfEnv } from '../types/cloudflare'

/**
 * Access Cloudflare bindings (Hyperdrive, R2) from any server handler.
 * In local dev, Nitro emulates the bindings from wrangler.jsonc and persists
 * their local state under `.wrangler/state/v3`.
 */
export function cfEnv(event: H3Event): CfEnv {
  const env = event.context.cloudflare?.env
  if (!env) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare bindings unavailable (not running under workerd)',
    })
  }
  return env
}

/**
 * Totally optional in dev: fall back to a local Postgres URL when the
 * Hyperdrive binding is absent (e.g. `nuxt dev` without the cloudflare preset).
 */
export function dbConnectionString(event: H3Event): string {
  const env = event.context.cloudflare?.env
  if (env?.HYPERDRIVE?.connectionString) return env.HYPERDRIVE.connectionString
  const config = useRuntimeConfig(event)
  return config.databaseUrl
}
