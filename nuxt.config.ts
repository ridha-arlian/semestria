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
  experimental: {
    viewTransition: true
  }
})