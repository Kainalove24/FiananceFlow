import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';

// Make sure you use the pooler URL, not the Direct Connection URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set (use the pooler URL)');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // no need for ws or SSL tweaks here, pooler handles it
});

export const db = drizzle({ client: pool, schema });
