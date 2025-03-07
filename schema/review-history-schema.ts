/**
 * ### Review History Table
```sql
CREATE TABLE review_history (
  id TEXT PRIMARY KEY,
  user_flashcard_progress_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performance TEXT CHECK(performance IN ('again', 'hard', 'good', 'easy')) NOT NULL,
  time_taken INTEGER NOT NULL, -- Milliseconds
  is_correct BOOLEAN NOT NULL,
  FOREIGN KEY (user_flashcard_progress_id) REFERENCES user_flashcard_progress(id) ON DELETE CASCADE
);
```
 */

import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const reviewHistory = sqliteTable('review_history', {
  id: text('id').primaryKey(),
  user_flashcard_progress_id: text('user_flashcard_progress_id').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
  performance: text('performance').notNull(),
  time_taken: integer('time_taken').notNull(),
  is_correct: integer('is_correct', { mode: "boolean" }).notNull(),
}, table => [
  check('performance', sql`${table.performance} IN ('again', 'hard', 'good', 'easy')`),
]);