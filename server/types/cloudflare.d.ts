// Cloudflare bindings, injected by workerd (Nitro `cloudflare_module` preset).
// Access at runtime: `event.context.cloudflare.env` (Nitro v2 h3 v1 shim).

export interface Hyperdrive {
  connectionString: string
}

export interface CfEnv {
  HYPERDRIVE: Hyperdrive
  FILES: R2Bucket
}

declare global {
  interface H3EventContext {
    cloudflare?: {
      env: CfEnv
      req: { url: string }
      ctx: { waitUntil: (p: Promise<unknown>) => void }
    }
  }
}

export {}
