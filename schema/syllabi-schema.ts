import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { topics } from "./topic-schema";


export const syllabi = sqliteTable('syllabi', {
  id: text('id').primaryKey(),
  topic_id: text('topic_id').notNull().references(() => topics.id, { onDelete: "cascade" }),
  content: text('content').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  last_updated: text('last_updated').default(sql`CURRENT_TIMESTAMP`),
  adaptation_count: integer('adaptation_count').default(0),
});