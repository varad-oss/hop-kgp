import { Pool } from 'pg';

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

let pool: Pool | undefined;

export function getDb(): Db {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  }
  const p = pool;
  return {
    async query<T>(text: string, params?: unknown[]) {
      const res = await p.query(text, params as unknown[]);
      return res.rows as T[];
    },
  };
}
