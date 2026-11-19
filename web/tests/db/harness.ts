import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import type { Db } from '@/server/db';

const MIGRATIONS = path.resolve(__dirname, '../../db/migrations');

export async function createTestDb(): Promise<Db> {
  const pg = new PGlite();
  for (const f of fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
  }
  return {
    async query<T>(text: string, params?: unknown[]) {
      const res = await pg.query(text, params as unknown[]);
      return res.rows as T[];
    },
  };
}
