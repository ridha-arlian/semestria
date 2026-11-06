// Cloudflare bindings, injected by workerd (Nitro `cloudflare_module` preset).
// Access at runtime: `event.context.cloudflare.env` (Nitro v2 h3 v1 shim).

import type { Pool } from 'pg'
import type { PrismaClient } from '../generated/prisma/client'

export interface Hyperdrive {
  connectionString: string
}

/** Per-request database handle; see `server/utils/db.ts`. */
export interface RequestDb {
  client: PrismaClient
  pool: Pool
}

export interface CfEnv {
  HYPERDRIVE: Hyperdrive
  FILES: R2Bucket
}

declare global {
  interface H3EventContext {
    db?: RequestDb
    cloudflare?: {
      env: CfEnv
      req: { url: string }
      ctx: { waitUntil: (p: Promise<unknown>) => void }
    }
  }
}

export {}
