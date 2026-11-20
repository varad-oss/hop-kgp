import { randomUUID } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { createTestDb } from '../db/harness';
import { createFakeNexconn } from '../fakes/nexconn';
import { ensureUser } from '@/server/auth';
import { demoTravellerLeaves, startDemo } from '@/server/demo';
import { lobbySummary } from '@/server/lobbies';
import { joinProposal, lockProposal } from '@/server/proposals';
import { buildTicket } from '@/server/pods';
import { makeUser } from '../helpers/world';

const NOW = new Date('2026-11-25T10:00:00Z');
const guest = (db: Awaited<ReturnType<typeof createTestDb>>, name = 'guest') =>
  ensureUser(db, { authId: randomUUID(), email: null, name, isDemo: true });

describe('startDemo', () => {
  test('builds an isolated lobby with two labelled demo travellers and a proposal at inCount 2', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const g = await guest(db);
    const { lobbyId } = await startDemo(db, nx, g, NOW);
    const s = await lobbySummary(db, lobbyId, g);
    expect(s.lobby).toMatchObject({ is_demo: true, destination: 'HWH', travel_date: '2026-11-26' });
    expect(s.members.map((m) => m.name).sort()).toEqual(['Demo · Aarav', 'Demo · Meera', 'guest']);
    const p = await db.query<{ status: string }>('select status from hop.proposals where lobby_id = $1', [lobbyId]);
    expect(p).toHaveLength(1);
    const votes = await db.query('select 1 from hop.votes');
    expect(votes).toHaveLength(2);
    expect(g.hall).toBeNull(); // the guest's own row is returned stale; the DB row is filled below
    const fresh = (await db.query<{ hall: string; phone: string }>('select hall, phone from hop.users where id = $1', [g.id]))[0];
    expect(fresh.hall).toBe('Demo');
  });

  test('starting twice returns the same lobby and does not add proposals', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const g = await guest(db);
    const a = await startDemo(db, nx, g, NOW);
    const b = await startDemo(db, nx, g, NOW);
    expect(b.lobbyId).toBe(a.lobbyId);
    expect(await db.query('select 1 from hop.proposals')).toHaveLength(1);
  });

  test('a real user cannot start a demo (403) and cannot see the demo lobby (404)', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const real = await makeUser(db, 'riya');
    await expect(startDemo(db, nx, real, NOW)).rejects.toMatchObject({ status: 403 });
    const { lobbyId } = await startDemo(db, nx, await guest(db), NOW);
    await expect(lobbySummary(db, lobbyId, real)).rejects.toMatchObject({ status: 404 });
  });

  test('two different guests get separate sandboxes sharing the same traveller identities', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const a = await startDemo(db, nx, await guest(db, 'g1'), NOW);
    const b = await startDemo(db, nx, await guest(db, 'g2'), NOW);
    expect(a.lobbyId).not.toBe(b.lobbyId);
    expect(await db.query(`select 1 from hop.users where name like 'Demo · %'`)).toHaveLength(2);
  });

  test('demo travellers never get a Nexconn token', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    await startDemo(db, nx, await guest(db), NOW);
    const issued = nx.calls.filter((c) => c.method === 'issueToken').map((c) => (c.args as any).userId as string);
    expect(issued.every((id) => !id.startsWith('demo'))).toBe(true);
  });
});

describe('the demo story', () => {
  test('guest joins (₹934 each), locks, then Meera leaves and the fare re-splits to ₹1,400', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const g = await guest(db);
    const { lobbyId } = await startDemo(db, nx, g, NOW);
    const gFresh = (await db.query<any>('select * from hop.users where id = $1', [g.id]))[0];
    const proposalId = (await db.query<{ id: string }>('select id from hop.proposals where lobby_id = $1', [lobbyId]))[0].id;
    expect(await joinProposal(db, nx, gFresh, proposalId, NOW)).toMatchObject({ result: 'joined', inCount: 3 });
    const { podId } = await lockProposal(db, nx, gFresh, proposalId);
    expect((await buildTicket(db, podId!)).each).toBe(934);
    await demoTravellerLeaves(db, nx, gFresh, NOW);
    const t = await buildTicket(db, podId!);
    expect(t.each).toBe(1400);
    expect(t.members.every((m) => m.phone === 'Demo number')).toBe(true);
    expect(t.members.map((m) => m.name).sort()).toEqual(['Demo · Aarav', 'guest']);
  });
});

import { demoExists } from '@/server/demo';
describe('demoExists', () => {
  test('false before the first demo, true after', async () => {
    const db = await createTestDb();
    const g = await guest(db);
    expect(await demoExists(db, g)).toBe(false);
    await startDemo(db, createFakeNexconn(), g, NOW);
    expect(await demoExists(db, g)).toBe(true);
  });
});
