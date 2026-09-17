import { migrate } from 'drizzle-orm/node-postgres/migrator'

export default defineNitroPlugin(async () => {
  try {
    await migrate(useDb(), { migrationsFolder: 'server/db/migrations' })
  }
  catch (err) {
    console.error('[db] migration failed, check NUXT_DATABASE_URL', err)
  }
})
