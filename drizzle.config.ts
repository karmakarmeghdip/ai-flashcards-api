import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './schema/*.ts',
  dialect: 'turso',
  dbCredentials: {
    url: 'file:dev.db',
  }
});
