import { beforeEach, describe, expect, test } from 'vitest';
import type { Db } from '@/server/db';
import { createTestDb } from './harness';

const NOW = '2026-11-25T10:00:00Z';
const DEPART = '2026-11-26T01:00:00Z';

type World = { db: Db; lobby: string; users: string[]; prop: string };

async function seed(seats = 4): Promise<World> {
  const db = await createTestDb();
  const users: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = await db.query<{ id: string }>(
      `insert into hop.users(auth_id, name, nexconn_id) values (gen_random_uuid(), $1, $1) returning id`,
      [`user${i}`],
    );
    users.push(r[0].id);
  }
  const lobby = (
    await db.query<{ id: string }>(
      `insert into hop.lobbies(destination, direction, travel_date, channel_id) values ('HWH','out','2026-11-26','lobby1') returning id`,
    )
  )[0].id;
  for (const u of users) {
    await db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [u, lobby]);
  }
  const prop = await propose(db, lobby, users[0], seats);
  return { db, lobby, users, prop };
}

async function propose(db: Db, lobby: string, creator: string, seats = 4): Promise<string> {
  return (
    await db.query<{ id: string }>(
      `insert into hop.proposals(lobby_id, creator_id, depart_at, meeting_point, vehicle, total_fare, seats)
       values ($1,$2,$3,'Main Building gate','sedan',2800,$4) returning id`,
      [lobby, creator, DEPART, seats],
    )
  )[0].id;
}

const join = async (db: Db, p: string, u: string, now = NOW) =>
  (await db.query<{ result: string; in_count: number; pod_id: string | null; moved_from: string | null }>(
    `select * from hop.join_proposal($1,$2,$3)`,
    [p, u, now],
  ))[0];
const leave = async (db: Db, p: string, u: string, now = NOW) =>
  (await db.query<{ result: string; in_count: number; pod_id: string | null }>(`select * from hop.leave_proposal($1,$2,$3)`, [p, u, now]))[0];
const lock = async (db: Db, p: string, u: string) =>
  (await db.query<{ result: string; pod_id: string | null }>(`select * from hop.lock_proposal($1,$2)`, [p, u]))[0];

let w: World;
beforeEach(async () => {
  w = await seed();
});

describe('join_proposal', () => {
  test('join increments; repeat is already; joins beyond seats are full', async () => {
    const s = await seed(2);
    expect(await join(s.db, s.prop, s.users[0])).toMatchObject({ result: 'joined', in_count: 1 });
    expect(await join(s.db, s.prop, s.users[0])).toMatchObject({ result: 'already', in_count: 1 });
    expect(await join(s.db, s.prop, s.users[1])).toMatchObject({ result: 'joined', in_count: 2 });
    expect(await join(s.db, s.prop, s.users[2])).toMatchObject({ result: 'full', in_count: 2 });
  });

  test('user without an intent in the lobby gets not_in_lobby', async () => {
    const stranger = (await w.db.query<{ id: string }>(`insert into hop.users(auth_id, name, nexconn_id) values (gen_random_uuid(),'s','s') returning id`))[0].id;
    expect((await join(w.db, w.prop, stranger)).result).toBe('not_in_lobby');
  });

  test('join at or after depart_at is departed; cancelled is closed', async () => {
    expect((await join(w.db, w.prop, w.users[1], DEPART)).result).toBe('departed');
    await w.db.query(`update hop.proposals set status='cancelled' where id=$1`, [w.prop]);
    expect((await join(w.db, w.prop, w.users[1])).result).toBe('closed');
  });

  test('joining a second proposal moves the vote and returns moved_from', async () => {
    const p2 = await propose(w.db, w.lobby, w.users[1]);
    await join(w.db, w.prop, w.users[2]);
    const r = await join(w.db, p2, w.users[2]);
    expect(r).toMatchObject({ result: 'joined', in_count: 1, moved_from: w.prop });
    const [c] = await w.db.query<{ n: string }>(`select count(*)::text n from hop.votes where proposal_id=$1`, [w.prop]);
    expect(c.n).toBe('0');
  });
});

describe('lock_proposal', () => {
  test('lock needs the caller to have voted and at least 2 votes', async () => {
    await join(w.db, w.prop, w.users[0]);
    expect((await lock(w.db, w.prop, w.users[2])).result).toBe('not_voter');
    expect((await lock(w.db, w.prop, w.users[0])).result).toBe('too_few');
  });

  test('lock creates a pending pod with voters in; a second lock returns already_locked with the same pod', async () => {
    await join(w.db, w.prop, w.users[0]);
    await join(w.db, w.prop, w.users[1]);
    const a = await lock(w.db, w.prop, w.users[0]);
    expect(a.result).toBe('locked');
    const b = await lock(w.db, w.prop, w.users[1]);
    expect(b).toMatchObject({ result: 'already_locked', pod_id: a.pod_id });
    const pod = (await w.db.query<{ status: string; channel_id: string }>(`select status, channel_id from hop.pods where id=$1`, [a.pod_id]))[0];
    expect(pod.status).toBe('pending');
    expect(pod.channel_id).toBe(`p${a.pod_id!.replace(/-/g, '')}`);
    const members = await w.db.query(`select user_id from hop.pod_members where pod_id=$1 and status='in'`, [a.pod_id]);
    expect(members).toHaveLength(2);
    expect((await w.db.query<{ status: string }>(`select status from hop.proposals where id=$1`, [w.prop]))[0].status).toBe('locked');
  });

  test("lock removes the voters' votes on other open proposals in the lobby", async () => {
    const p2 = await propose(w.db, w.lobby, w.users[1]);
    await join(w.db, w.prop, w.users[0]);
    await join(w.db, w.prop, w.users[1]);
    await w.db.query(`insert into hop.votes(proposal_id, user_id) values ($1,$2)`, [p2, w.users[0]]);
    await lock(w.db, w.prop, w.users[0]);
    const [c] = await w.db.query<{ n: string }>(`select count(*)::text n from hop.votes where proposal_id=$1`, [p2]);
    expect(c.n).toBe('0');
  });
});

describe('after lock', () => {
  async function locked(seats = 4) {
    const s = await seed(seats);
    await join(s.db, s.prop, s.users[0]);
    await join(s.db, s.prop, s.users[1]);
    const l = await lock(s.db, s.prop, s.users[0]);
    return { ...s, pod: l.pod_id! };
  }

  test('a pod member joining another open proposal in the same lobby is busy', async () => {
    const s = await locked();
    const p2 = await propose(s.db, s.lobby, s.users[3]);
    expect((await join(s.db, p2, s.users[0])).result).toBe('busy');
  });

  test('a locked proposal with a free seat accepts a join into the pod, then is full', async () => {
    const s = await locked(3);
    expect(await join(s.db, s.prop, s.users[2])).toMatchObject({ result: 'joined', in_count: 3, pod_id: s.pod });
    expect((await join(s.db, s.prop, s.users[3])).result).toBe('full');
  });

  test('leave after lock marks the member left; the last leave archives the pod and cancels the proposal', async () => {
    const s = await locked();
    expect(await leave(s.db, s.prop, s.users[1])).toMatchObject({ result: 'left', in_count: 1, pod_id: s.pod });
    expect((await leave(s.db, s.prop, s.users[1])).result).toBe('not_in');
    await leave(s.db, s.prop, s.users[0]);
    expect((await s.db.query<{ status: string }>(`select status from hop.pods where id=$1`, [s.pod]))[0].status).toBe('archived');
    expect((await s.db.query<{ status: string }>(`select status from hop.proposals where id=$1`, [s.prop]))[0].status).toBe('cancelled');
  });

  test('leaving an open proposal removes the vote', async () => {
    await join(w.db, w.prop, w.users[0]);
    expect(await leave(w.db, w.prop, w.users[0])).toMatchObject({ result: 'left', in_count: 0 });
  });
});


describe('cross-proposal integrity (migration 0003)', () => {
  test('joining a locked pod clears the user\'s votes on other open proposals and reports moved_from', async () => {
    const s = await seed(4);
    await join(s.db, s.prop, s.users[0]);
    await join(s.db, s.prop, s.users[1]);
    await lock(s.db, s.prop, s.users[0]);
    const other = await propose(s.db, s.lobby, s.users[3]);
    await join(s.db, other, s.users[2]);
    const r = await join(s.db, s.prop, s.users[2]);
    expect(r).toMatchObject({ result: 'joined', moved_from: other });
    const [c] = await s.db.query<{ n: string }>(`select count(*)::text n from hop.votes where proposal_id = $1 and user_id = $2`, [other, s.users[2]]);
    expect(c.n).toBe('0');
  });

  test('lock never puts someone who is already in another pod of this lobby into a second pod', async () => {
    const s = await seed(5);
    await join(s.db, s.prop, s.users[0]);
    await join(s.db, s.prop, s.users[1]);
    await lock(s.db, s.prop, s.users[0]);
    const other = await propose(s.db, s.lobby, s.users[3]);
    for (const u of [3, 4, 2]) await s.db.query(`insert into hop.votes(proposal_id, user_id) values ($1,$2)`, [other, s.users[u]]);
    await s.db.query(`insert into hop.pod_members(pod_id, user_id, status) select pd.id, $2, 'in' from hop.pods pd where pd.proposal_id = $1`, [s.prop, s.users[2]]);
    const l = await lock(s.db, other, s.users[3]);
    expect(l.result).toBe('locked');
    const members = await s.db.query<{ user_id: string }>(`select user_id from hop.pod_members where pod_id = $1 and status = 'in'`, [l.pod_id]);
    expect(members.map((m) => m.user_id).sort()).toEqual([s.users[3], s.users[4]].sort());
    const [n] = await s.db.query<{ n: string }>(`select count(*)::text n from hop.pod_members where user_id = $1 and status = 'in'`, [s.users[2]]);
    expect(n.n).toBe('1');
  });

  test('lock fails with too_few when removing people already in another pod leaves fewer than two', async () => {
    const s = await seed(4);
    await join(s.db, s.prop, s.users[0]);
    await join(s.db, s.prop, s.users[1]);
    await lock(s.db, s.prop, s.users[0]);
    const other = await propose(s.db, s.lobby, s.users[3]);
    for (const u of [3, 1]) await s.db.query(`insert into hop.votes(proposal_id, user_id) values ($1,$2)`, [other, s.users[u]]);
    expect((await lock(s.db, other, s.users[3])).result).toBe('too_few');
  });

  test('a stale plan cannot be locked after its departure time', async () => {
    const s = await seed(3);
    await join(s.db, s.prop, s.users[0]);
    await join(s.db, s.prop, s.users[1]);
    const r = (await s.db.query<{ result: string }>(`select * from hop.lock_proposal($1,$2,$3)`, [s.prop, s.users[0], DEPART]))[0];
    expect(r.result).toBe('departed');
  });
});
