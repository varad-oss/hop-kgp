import { describe, expect, test } from 'vitest';
import { createTestDb } from './harness';

describe('schema', () => {
  test('migrations apply on PGlite and tables live in schema hop', async () => {
    const db = await createTestDb();
    const rows = await db.query<{ table_schema: string }>(
      `select table_schema from information_schema.tables where table_name = 'users'`,
    );
    expect(rows.map((r) => r.table_schema)).toEqual(['hop']);
  });

  test('RLS is enabled on every hop table', async () => {
    const db = await createTestDb();
    const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'hop' and c.relkind = 'r' and c.relname <> 'schema_migrations'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.filter((r) => !r.relrowsecurity)).toEqual([]);
  });

  test('real lobbies are unique per destination+direction+date; demo lobbies per owner', async () => {
    const db = await createTestDb();
    const u = async (n: string) =>
      (await db.query<{ id: string }>(
        `insert into hop.users(auth_id, name, nexconn_id, is_demo) values (gen_random_uuid(), $1, $1, true) returning id`,
        [n],
      ))[0].id;
    const real = (ch: string) =>
      db.query(`insert into hop.lobbies(destination, direction, travel_date, channel_id) values ('HWH','out','2026-11-26',$1)`, [ch]);
    await real('l1');
    await expect(real('l2')).rejects.toThrow();

    const [a, b] = [await u('a'), await u('b')];
    const demo = (owner: string, ch: string) =>
      db.query(
        `insert into hop.lobbies(destination, direction, travel_date, channel_id, is_demo, demo_owner) values ('HWH','out','2026-11-26',$1,true,$2)`,
        [ch, owner],
      );
    await demo(a, 'ld1');
    await demo(b, 'ld2');
    await expect(demo(a, 'ld3')).rejects.toThrow();
  });
});
