import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/src/db/schema';

const globalForDb = globalThis as typeof globalThis & {
  msikaPool?: Pool;
  msikaDb?: ReturnType<typeof createDb>;
};

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Database client cannot be initialized.');
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const dbUnavailable = new Proxy(
  {},
  {
    get() {
      throw new Error('Database client is unavailable in this environment.');
    },
  }
) as ReturnType<typeof createDb>;

export const db = globalForDb.msikaDb ?? (isBuildPhase ? dbUnavailable : createDb());

if (process.env.NODE_ENV !== 'production' && !isBuildPhase) {
  globalForDb.msikaDb = db;
}
