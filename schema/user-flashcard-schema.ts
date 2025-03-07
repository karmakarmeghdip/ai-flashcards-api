import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import { flashcards } from "./flashcard-schema";

export const userFlashcardProgress = sqliteTable('user_flashcard_progress', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: "cascade" }),
  flashcard_id: text('flashcard_id').notNull().references(() => flashcards.id, { onDelete: "cascade" }),
  next_review_date: text('next_review_date'),
  correct_count: integer('correct_count').default(0),
  incorrect_count: integer('incorrect_count').default(0),
  last_reviewed_at: text('last_reviewed_at'),
  confidence: integer('confidence').default(0),
  time_to_answer: integer('time_to_answer'),
  mastered: integer('mastered', { mode: "boolean" }).default(false),
}, table => [
  unique().on(table.user_id, table.flashcard_id)
]);