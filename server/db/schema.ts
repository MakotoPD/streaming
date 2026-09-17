import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { Channels, Settings } from '../../shared/types'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  channels: jsonb().$type<Channels>().notNull().default({}),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
})

export const accounts = pgTable('accounts', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text().$type<'twitch' | 'kick'>().notNull(),
  providerId: text().notNull(),
  login: text().notNull(),
  displayName: text().notNull(),
  avatar: text(),
  accessToken: text(),
  refreshToken: text(),
  tokenExpiresAt: timestamp({ withTimezone: true }),
  scopes: jsonb().$type<string[]>().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [
  uniqueIndex().on(t.provider, t.providerId),
  index().on(t.userId)
])

export const widgets = pgTable('widgets', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text().notNull(),
  name: text().notNull(),
  token: text().notNull().unique(),
  settings: jsonb().$type<Settings>().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [index().on(t.userId)])

export const styles = pgTable('styles', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  widgetType: text().notNull(),
  name: text().notNull(),
  values: jsonb().$type<Settings>().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [index().on(t.userId)])

export const sounds = pgTable('sounds', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  file: text().notNull(),
  mime: text().notNull(),
  size: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [index().on(t.userId)])
