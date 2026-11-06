import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma v7 reads url from here. Name matches `.env` used by `prisma`
    // CLI. `DIRECT_URL` in `.env.example` is an alias for the same value —
    // keep them in sync (do NOT rename one without the other).
    url: databaseUrl(),
  },
})

function databaseUrl(): string {
  const value = process.env.DATABASE_URL ?? process.env.DIRECT_URL
  if (value) return value
  // `prisma generate` runs from postinstall, before locals configure a
  // database. Generation never connects, so a placeholder is safe here.
  if (process.argv.includes('generate')) return 'postgresql://localhost:5432/semestria'
  throw new Error('Missing required env var: DATABASE_URL (or DIRECT_URL)')
}
