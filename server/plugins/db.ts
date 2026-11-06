import { closeDb } from '../utils/db'

/**
 * Workers cannot reuse connections across requests. Each request builds its
 * own client in `useDb`; close it once the response is done. `event.waitUntil`
 * forwards to the Cloudflare execution context so cleanup survives the
 * response. Every internal `$fetch` subrequest gets its own event and cleanup.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('afterResponse', (event) => {
    event.waitUntil(closeDb(event))
  })
})
