import type { H3Event } from 'h3'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '../generated/prisma/client'
import { dbConnectionString } from './cf'

/**
 * Prisma Client over Cloudflare Hyperdrive.
 *
 * Workers forbid reusing database I/O objects across requests: a pooled socket
 * created during one request can never resolve inside the next one, and the
 * runtime cancels the request as "hung". So the client lives on the event, not
 * in module scope. Hyperdrive does the real pooling, so a fresh `pg` pool per
 * request is cheap.
 *
 * Transactions here are real Postgres transactions over Hyperdrive — this
 * is why Supabase+Hyperdrive was chosen over D1 (D1 has no transactions).
 */
export function useDb(event: H3Event): PrismaClient {
  if (event.context.db) return event.context.db.client

  const connectionString = dbConnectionString(event)
  if (!connectionString) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing database connection (HYPERDRIVE binding or runtimeConfig.databaseUrl)',
    })
  }

  const pool = new Pool({
    connectionString,
    // Workers allow a small number of concurrent outbound connections.
    max: 5,
    // Fail fast instead of leaving the request to be killed as "hung".
    connectionTimeoutMillis: 10_000,
  })

  const client = new PrismaClient({
    adapter: new PrismaPg(pool, { disposeExternalPool: false }),
  })

  event.context.db = { client, pool }
  return client
}

/**
 * Ends the request's pool. Call from `afterResponse`; the Nitro plugin in
 * `server/plugins/db.ts` wires this up and shelters it with `waitUntil`.
 */
export async function closeDb(event: H3Event): Promise<void> {
  const entry = event.context.db
  if (!entry) return
  event.context.db = undefined

  await entry.client.$disconnect().catch(() => {})
  await entry.pool.end().catch(() => {})
}
