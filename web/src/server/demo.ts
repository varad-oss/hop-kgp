import { demoScope, ensureUser, type UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import { istToday, postIntent } from './lobbies';
import type { NexconnApi } from './nexconn/api';
import { createProposal, joinProposal, leaveProposal } from './proposals';

// Fixed identities for the two labelled, server-only demo travellers. They never connect a client or get a token.
const AARAV = { authId: '00000000-0000-4000-8000-0000000000a1', name: 'Demo · Aarav', hall: 'Azad' };
const MEERA = { authId: '00000000-0000-4000-8000-0000000000a2', name: 'Demo · Meera', hall: 'SN/IG' };

async function traveller(db: Db, t: typeof AARAV, scope: string): Promise<UserRow> {
  const u = await ensureUser(db, { authId: t.authId, email: null, name: t.name, isDemo: true });
  await db.query('update hop.users set hall = $2, phone = $3 where id = $1', [u.id, t.hall, 'Demo number']);
  return { ...u, hall: t.hall, phone: 'Demo number', demo_group: scope };
}

function tomorrowIst(now: Date): string {
  return istToday(new Date(now.getTime() + 24 * 3600_000));
}

export async function demoExists(db: Db, user: UserRow): Promise<boolean> {
  const rows = await db.query(`select 1 from hop.lobbies where is_demo and demo_owner = $1 and destination = 'HWH' and direction = 'out' limit 1`, [demoScope(user)]);
  return rows.length > 0;
}

export async function startDemo(db: Db, nx: NexconnApi, user: UserRow, now: Date = new Date()): Promise<{ lobbyId: string }> {
  if (!user.is_demo) throw new HttpError(403, 'demo_only');
  const scope = demoScope(user);
  const date = tomorrowIst(now);
  const key = { destination: 'HWH', direction: 'out', date } as const;

  const existing = await db.query<{ id: string }>(
    `select id from hop.lobbies where is_demo and demo_owner = $1 and destination = 'HWH' and direction = 'out' order by created_at desc limit 1`,
    [scope],
  );
  if (existing[0]) return { lobbyId: existing[0].id };

  await db.query('update hop.users set hall = $2, phone = $3 where id = $1', [user.id, 'Demo', '9999999999']);
  const aarav = await traveller(db, AARAV, scope);
  const meera = await traveller(db, MEERA, scope);

  const mine = await postIntent(db, nx, { ...user, hall: 'Demo', phone: '9999999999' }, { ...key, window: 'w1', bags: 1 }, now);
  await postIntent(db, nx, aarav, { ...key, window: 'w1', bags: 2 }, now);
  await postIntent(db, nx, meera, { ...key, window: 'w1', bags: 1 }, now);

  const { proposalId } = await createProposal(
    db,
    nx,
    aarav,
    { lobbyId: mine.lobbyId, departAt: `${date}T01:00:00Z`, meetingPoint: 'Main Building gate', vehicle: 'sedan', totalFare: 2800, seats: 4 },
    now,
  );
  await joinProposal(db, nx, meera, proposalId, now);

  const lobby = (await db.query<{ channel_id: string }>('select channel_id from hop.lobbies where id = $1', [mine.lobbyId]))[0];
  await nx.sendGroupMessage({
    fromUserId: aarav.nexconn_id,
    channelId: lobby.channel_id,
    messageType: 'RC:TxtMsg',
    content: { content: 'Leaving from Azad, 2 bags 🙂' },
  });
  return { lobbyId: mine.lobbyId };
}

/** Meera leaves the guest's locked demo trip so the judge sees the fare re-split. */
export async function demoTravellerLeaves(db: Db, nx: NexconnApi, user: UserRow, now: Date = new Date()): Promise<void> {
  if (!user.is_demo) throw new HttpError(403, 'demo_only');
  const scope = demoScope(user);
  const meera = await traveller(db, MEERA, scope);
  const row = await db.query<{ id: string }>(
    `select pr.id from hop.proposals pr join hop.lobbies l on l.id = pr.lobby_id
      where l.is_demo and l.demo_owner = $1 and pr.status = 'locked' order by pr.created_at desc limit 1`,
    [scope],
  );
  if (row[0]) await leaveProposal(db, nx, meera, row[0].id, now);
}
