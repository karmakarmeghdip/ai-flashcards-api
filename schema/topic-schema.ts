import { sql } from "drizzle-orm";
import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text('title').notNull(),
  description: text('description'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  last_studied: text('last_studied'),
  proficiency_score: real('proficiency_score').default(0),
})

