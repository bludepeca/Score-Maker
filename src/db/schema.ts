import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const animes = sqliteTable('animes', {
  id: integer('id').primaryKey(),
  anilistId: integer('anilist_id').notNull().unique(),
  title: text('title').notNull(),
  coverImage: text('cover_image'),
  episodes: integer('episodes'),
  genres: text('genres'),
  studio: text('studio'),
});

export const criteria = sqliteTable('criteria', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  weight: real('weight').notNull(),
  order: integer('order').notNull().default(0),
});

export const scores = sqliteTable('scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  animeId: integer('anime_id').notNull().references(() => animes.id),
  calculatedScore: real('calculated_score').notNull(),
  manualScore: real('manual_score'),
  finalScore: real('final_score').notNull(),
  breakdown: text('breakdown').notNull(), // JSON string representing the criteria scores
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // e.g., 'UPDATE_SCORE'
  payload: text('payload').notNull(), // JSON string of what to sync
  status: text('status').notNull().default('pending_upload'), // 'pending_upload', 'synced', 'conflict'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
