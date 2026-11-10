import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-22',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      title: 'Semestria',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/logo.svg?v=2'
        }
      ],
      script: [
        {
          innerHTML: `try{var c=localStorage.getItem('semestria-theme-css');if(c){var s=document.createElement('style');s.id='settings-theme';s.textContent=c;document.head.appendChild(s)}}catch(e){}`,
          tagPosition: 'head',
        },
      ],
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    '@nuxt/eslint',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
  ],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  },
  runtimeConfig: {
    // No defaults for secrets. Override via env vars in production:
    // NUXT_DATABASE_URL, NUXT_SESSION_PASSWORD (32+ chars), NUXT_OAUTH_GOOGLE_*,
    // NUXT_R2_*. Local dev: set in .env (gitignored) or .dev.vars for Wrangler.
    // In Cloudflare, the Hyperdrive binding wins over databaseUrl (see cf.ts).
    databaseUrl: '',
    sessionPassword: '',
    oauth: {
      google: {
        clientId: '',
        clientSecret: '',
      },
    },
    r2: {
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucket: 'semestria-files',
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      // wrangler.jsonc is managed manually; don't let Nitro regenerate it.
      deployConfig: false,
    },
    // Prisma driver adapters ship wasm engines; Vite must handle them as assets.
    experimental: { wasm: true },
    alias: {
      // `pg` optionally `require('pg-native')` (lib/native/client.js). The
      // addon can't exist in workerd and Cloudflare forbids externals, so
      // alias it to an empty stub so Rollup can bundle the graph.
      // See `server/utils/pg-native-stub.ts`.
      'pg-native': '../server/utils/pg-native-stub.ts',
    },
  },
})