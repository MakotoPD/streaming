import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema'

export const tables = schema

let db: ReturnType<typeof createDb> | undefined

function createDb() {
  return drizzle(useRuntimeConfig().databaseUrl, { schema, casing: 'snake_case' })
}

export function useDb() {
  return (db ??= createDb())
}
