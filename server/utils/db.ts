import type { H3Event } from 'h3'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { dbConnectionString } from './cf'

/**
 * Prisma Client over Cloudflare Hyperdrive.
 *
 * One client per workerd isolate (module-level singleton). Do NOT use
 * `@prisma/client` default generation: the workerd runtime output makes the
 * client edge-compatible. Hyperdrive handles connection pooling, so the
 * adapter needs no pool sizing of its own.
 *
 * Transactions here are real Postgres transactions over Hyperdrive — this
 * is why Supabase+Hyperdrive was chosen over D1 (D1 has no transactions).
 */
let client: PrismaClient | undefined
let clientKey: string | undefined

export function useDb(event: H3Event): PrismaClient {
  const connectionString = dbConnectionString(event)
  if (!connectionString) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing database connection (HYPERDRIVE binding or runtimeConfig.databaseUrl)',
    })
  }

  // Hyperdrive (production) vs direct Postgres (local dev): rebuild the
  // singleton if the connection target changes between environments.
  const key = connectionString
  if (!client || clientKey !== key) {
    const adapter = new PrismaPg({ connectionString })
    client = new PrismaClient({ adapter })
    clientKey = key
  }
  return client
}
