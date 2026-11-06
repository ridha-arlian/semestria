// Stub for optional native binding in `pg` (lib/native/client.js requires
// `pg-native` behind try/catch). In Cloudflare Workers (workerd) there is no
// native addon, and Nitro's `cloudflare_module` preset forbids externals, so
// Rollup tries to resolve it and fails build. Aliasing `pg-native` to this
// empty module makes the bundle resolve without the native code.
// See `nitro.alias` in `nuxt.config.ts`.
export {}
