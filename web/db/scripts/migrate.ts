import { Client } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query('create schema if not exists hop');
  await client.query('create table if not exists hop.schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const dir = path.resolve(__dirname, '../migrations');
  const applied = new Set((await client.query('select name from hop.schema_migrations')).rows.map((r) => r.name));
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(f)) continue;
    await client.query('begin');
    try {
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('insert into hop.schema_migrations(name) values ($1)', [f]);
      await client.query('commit');
      console.log(`applied ${f}`);
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
