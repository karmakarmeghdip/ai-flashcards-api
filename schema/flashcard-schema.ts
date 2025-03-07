import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { syllabi } from "./syllabi-schema";

export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  syllabus_id: text('syllabus_id').notNull().references(() => syllabi.id, { onDelete: "cascade" }),
  subtopic_id: text('subtopic_id').notNull(),
  type: text('type').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  options: text('options'),
  correct_option: integer('correct_option'),
  difficulty: text('difficulty').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  interval: real('interval').default(1),
  ease_factor: real('ease_factor').default(2.5),
  due_date: text('due_date').default(sql`CURRENT_TIMESTAMP`),
  stage: integer('stage').default(0),
}, (table) => [
  check('type', sql`${table.type} IN ('info', 'mcq')`),
  check('difficulty', sql`${table.difficulty} IN ('easy', 'medium', 'hard')`)
]);