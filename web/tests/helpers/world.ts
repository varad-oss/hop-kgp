import { randomUUID } from 'node:crypto';
import { ensureUser, type UserRow } from '@/server/auth';
import type { Db } from '@/server/db';
import { createTestDb } from '../db/harness';
import { createFakeNexconn, type FakeNexconn } from '../fakes/nexconn';

export const DEPART = '2026-11-26T01:00:00Z';

export type World = {
  db: Db;
  nx: FakeNexconn;
  users: UserRow[];
  lobbyId: string;
  lobbyChannel: string;
  proposalId: string;
  podId?: string;
};

export async function makeUser(db: Db, name: string, opts: { isDemo?: boolean; phone?: string | null; hall?: string | null } = {}): Promise<UserRow> {
  const u = await ensureUser(db, { authId: randomUUID(), email: opts.isDemo ? null : `${name}@kgpian.iitkgp.ac.in`, name, isDemo: !!opts.isDemo });
  const phone = opts.phone === undefined ? '9876543210' : opts.phone;
  const hall = opts.hall === undefined ? 'Azad' : opts.hall;
  await db.query('update hop.users set phone = $2, hall = $3 where id = $1', [u.id, phone, hall]);
  return { ...u, phone, hall };
}

/** A lobby with `n` users who each have an intent (bags=1) and one open proposal created by users[0] (message_id 'mp1'). */
export async function makeWorld(n = 4, opts: { seats?: number; isDemo?: boolean; fare?: number; vehicle?: string } = {}): Promise<World> {
  const db = await createTestDb();
  const nx = createFakeNexconn();
  const users: UserRow[] = [];
  for (let i = 0; i < n; i++) users.push(await makeUser(db, `user${i}`, { isDemo: opts.isDemo }));
  const owner = opts.isDemo ? users[0].id : null;
  const lobbyChannel = `lobby${randomUUID().replace(/-/g, '')}`;
  const lobbyId = (
    await db.query<{ id: string }>(
      `insert into hop.lobbies(destination, direction, travel_date, channel_id, channel_ready, is_demo, demo_owner)
       values ('HWH','out','2026-11-26',$1,true,$2,$3) returning id`,
      [lobbyChannel, !!opts.isDemo, owner],
    )
  )[0].id;
  for (const u of users) await db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [u.id, lobbyId]);
  const proposalId = (
    await db.query<{ id: string }>(
      `insert into hop.proposals(lobby_id, creator_id, depart_at, meeting_point, vehicle, total_fare, seats, message_id)
       values ($1,$2,$3,'Main Building gate',$4,$5,$6,'mp1') returning id`,
      [lobbyId, users[0].id, DEPART, opts.vehicle ?? 'sedan', opts.fare ?? 2800, opts.seats ?? 4],
    )
  )[0].id;
  return { db, nx, users, lobbyId, lobbyChannel, proposalId };
}

export async function lockWith(w: World, voters: number[]): Promise<string> {
  for (const i of voters) await w.db.query('insert into hop.votes(proposal_id, user_id) values ($1,$2)', [w.proposalId, w.users[i].id]);
  const r = await w.db.query<{ result: string; pod_id: string }>('select * from hop.lock_proposal($1,$2)', [w.proposalId, w.users[voters[0]].id]);
  w.podId = r[0].pod_id;
  return r[0].pod_id;
}
