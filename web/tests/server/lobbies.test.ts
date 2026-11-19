import { randomUUID } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { createTestDb } from '../db/harness';
import { createFakeNexconn } from '../fakes/nexconn';
import { ensureUser, type UserRow } from '@/server/auth';
import type { Db } from '@/server/db';
import { listMyTrips, lobbySummary, postIntent } from '@/server/lobbies';

const NOW = new Date('2026-11-19T10:00:00Z');
const trip = { destination: 'HWH', direction: 'out', date: '2026-11-26', window: 'w1', bags: 2 } as const;

async function user(db: Db, name: string, isDemo = false, demoGroup?: string): Promise<UserRow> {
  const u = await ensureUser(db, { authId: randomUUID(), email: isDemo ? null : `${name}@kgpian.iitkgp.ac.in`, name, isDemo });
  if (demoGroup) await db.query('update hop.users set demo_group = $2 where id = $1', [u.id, demoGroup]);
  return { ...u, demo_group: demoGroup ?? null };
}
const calls = (nx: ReturnType<typeof createFakeNexconn>, m: string) => nx.calls.filter((c) => c.method === m);

describe('postIntent', () => {
  test('two users, same destination/direction/date → one lobby, one createGroup, two joins, two Hop:Intent sends', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const a = await postIntent(db, nx, await user(db, 'riya'), trip, NOW);
    const b = await postIntent(db, nx, await user(db, 'ankit'), { ...trip, window: 'w2' }, NOW);
    expect(b.lobbyId).toBe(a.lobbyId);
    expect(calls(nx, 'createGroup')).toHaveLength(1);
    expect(calls(nx, 'joinGroup')).toHaveLength(2);
    const sends = calls(nx, 'sendGroupMessage');
    expect(sends).toHaveLength(2);
    expect(sends[0].args).toMatchObject({ messageType: 'Hop:Intent', fromUserId: expect.stringMatching(/^u/) });
    expect((sends[0].args as any).content).toMatchObject({ name: 'riya', window: 'w1', bags: 2, isDemo: false });
  });

  test('the same user posting twice updates window and bags and keeps one intent', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const u = await user(db, 'riya');
    const first = await postIntent(db, nx, u, trip, NOW);
    const second = await postIntent(db, nx, u, { ...trip, window: 'w3', bags: 4 }, NOW);
    expect(first.created).toBe(true);
    expect(second).toMatchObject({ created: false, intentId: first.intentId });
    const rows = await db.query<{ window_key: string; bags: number }>('select window_key, bags from hop.intents');
    expect(rows).toEqual([{ window_key: 'w3', bags: 4 }]);
    expect(calls(nx, 'sendGroupMessage')).toHaveLength(2);
  });

  test('a demo user gets a separate demo lobby for the same destination and date', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const real = await postIntent(db, nx, await user(db, 'riya'), trip, NOW);
    const demo = await postIntent(db, nx, await user(db, 'guest', true), trip, NOW);
    expect(demo.lobbyId).not.toBe(real.lobbyId);
    expect((await db.query<{ is_demo: boolean }>('select is_demo from hop.lobbies where id = $1', [demo.lobbyId]))[0].is_demo).toBe(true);
  });

  test('demo users with the same demo_group share one demo lobby; different groups do not', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const g = randomUUID();
    const a = await postIntent(db, nx, await user(db, 'g1', true, g), trip, NOW);
    const b = await postIntent(db, nx, await user(db, 'g2', true, g), trip, NOW);
    const c = await postIntent(db, nx, await user(db, 'g3', true, randomUUID()), trip, NOW);
    expect(b.lobbyId).toBe(a.lobbyId);
    expect(c.lobbyId).not.toBe(a.lobbyId);
  });

  test.each([
    ['yesterday', '2026-11-18'],
    ['after the cap', '2027-02-01'],
  ])('a date %s is rejected with 400 date_out_of_range', async (_n, date) => {
    const db = await createTestDb();
    await expect(postIntent(db, createFakeNexconn(), await user(db, 'riya'), { ...trip, date }, NOW)).rejects.toMatchObject({
      status: 400,
      error: 'date_out_of_range',
    });
  });

  test('today in IST is allowed even late in the UTC day, and bad inputs are 400', async () => {
    const db = await createTestDb();
    const u = await user(db, 'riya');
    const lateUtc = new Date('2026-11-25T20:00:00Z'); // 01:30 IST on the 26th
    await expect(postIntent(db, createFakeNexconn(), u, { ...trip, date: '2026-11-26' }, lateUtc)).resolves.toBeTruthy();
    await expect(postIntent(db, createFakeNexconn(), u, { ...trip, date: '2026-11-25' }, lateUtc)).rejects.toMatchObject({ status: 400 });
    await expect(postIntent(db, createFakeNexconn(), u, { ...trip, bags: 9 }, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(postIntent(db, createFakeNexconn(), u, { ...trip, window: 'w9' as any }, NOW)).rejects.toMatchObject({ status: 400 });
  });
});

describe('lobbySummary and listMyTrips', () => {
  test('counts going and windows; 404 across the demo/real boundary and across demo groups', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const riya = await user(db, 'riya');
    const ankit = await user(db, 'ankit');
    const { lobbyId } = await postIntent(db, nx, riya, trip, NOW);
    await postIntent(db, nx, ankit, { ...trip, window: 'w2' }, NOW);
    const s = await lobbySummary(db, lobbyId, riya);
    expect(s).toMatchObject({ going: 2, openProposals: 0, lockedProposals: 0, myIntent: { window: 'w1', bags: 2 } });
    expect(s.windows).toMatchObject({ w1: 1, w2: 1 });
    expect(s.members.map((m) => m.name).sort()).toEqual(['ankit', 'riya']);

    await expect(lobbySummary(db, lobbyId, await user(db, 'guest', true))).rejects.toMatchObject({ status: 404 });
    const demoLobby = (await postIntent(db, nx, await user(db, 'd1', true), trip, NOW)).lobbyId;
    await expect(lobbySummary(db, demoLobby, riya)).rejects.toMatchObject({ status: 404 });
    await expect(lobbySummary(db, demoLobby, await user(db, 'd2', true))).rejects.toMatchObject({ status: 404 });
  });

  test('listMyTrips shows my lobbies with a readable title', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const riya = await user(db, 'riya');
    await postIntent(db, nx, riya, trip, NOW);
    await postIntent(db, nx, riya, { destination: 'KGP', direction: 'back', date: '2027-01-02', window: 'w1', bags: 1 }, NOW);
    const trips = await listMyTrips(db, riya);
    expect(trips.map((t) => t.title)).toEqual(['Howrah Station · Thu 26 Nov', 'Kharagpur Station · Sat 2 Jan → KGP']);
    expect(trips[0]).toMatchObject({ podId: null, podStatus: null });
  });
});

test('listMyTrips returns one row per lobby even when several proposals are locked there', async () => {
  const db = await createTestDb();
  const nx = createFakeNexconn();
  const riya = await user(db, 'riya');
  const { lobbyId } = await postIntent(db, nx, riya, trip, NOW);
  for (let n = 0; n < 2; n++) {
    const other = await user(db, `o${n}`);
    await postIntent(db, nx, other, trip, NOW);
    const p = (await db.query<{ id: string }>(
      `insert into hop.proposals(lobby_id, creator_id, depart_at, meeting_point, vehicle, total_fare, seats, status)
       values ($1,$2,'2026-11-26T01:00:00Z','gate','sedan',2800,4,'locked') returning id`, [lobbyId, other.id]))[0].id;
    await db.query(`insert into hop.pods(proposal_id, channel_id) values ($1, $2)`, [p, `pod${n}`]);
  }
  expect(await listMyTrips(db, riya)).toHaveLength(1);
});

import { makeWorld } from '../helpers/world';
import { lockWith } from '../helpers/world';

describe('lobbySummary carries plans and intents from the database', () => {
  test('returns every open or locked proposal with live meta, and every intent as a card', async () => {
    const w = await makeWorld(3);
    for (const i of [0, 1]) await w.db.query('insert into hop.votes(proposal_id, user_id) values ($1,$2)', [w.proposalId, w.users[i].id]);
    const s = await lobbySummary(w.db, w.lobbyId, w.users[2]);
    expect(s.proposals).toHaveLength(1);
    expect(s.proposals[0].proposal).toMatchObject({ proposalId: w.proposalId, creatorName: 'user0', meetingPoint: 'Main Building gate', vehicle: 'sedan', totalFare: 2800, seats: 4, isDemo: false });
    expect(s.proposals[0].proposal.departAt).toBe('2026-11-26T01:00:00Z');
    expect(s.proposals[0].meta).toMatchObject({ status: 'open', inCount: 2, voters: [w.users[0].nexconn_id, w.users[1].nexconn_id] });
    expect(s.intents.map((i) => i.name).sort()).toEqual(['user0', 'user1', 'user2']);
    expect(s.intents[0]).toMatchObject({ window: 'w1', bags: 1, isDemo: false });
  });

  test('a locked proposal is included with its pod id; cancelled ones are not', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    expect((await lobbySummary(w.db, w.lobbyId, w.users[2])).proposals[0].meta).toMatchObject({ status: 'locked', podId: pod });
    await w.db.query(`update hop.proposals set status = 'cancelled'`);
    expect((await lobbySummary(w.db, w.lobbyId, w.users[2])).proposals).toHaveLength(0);
  });
});
