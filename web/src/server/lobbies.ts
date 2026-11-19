import { randomUUID } from 'node:crypto';
import { DESTINATIONS, MAX_TRIP_DATE, WINDOWS, WINDOW_KEYS, type DestKey, type Direction, type WindowKey } from '@/domain/catalog';
import { CARD_INTENT, type HopIntent } from '@/domain/cards';
import { lobbyTitle } from '@/domain/copy';
import { demoScope, type UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import { lobbyChannelId } from './ids';
import type { NexconnApi } from './nexconn/api';

export type LobbyRow = {
  id: string;
  destination: DestKey;
  direction: Direction;
  travel_date: string;
  is_demo: boolean;
  demo_owner: string | null;
  channel_id: string;
};

export const botId = () => process.env.HOPBOT_ID ?? 'hopbot';

let botReady = false;
async function ensureBot(nx: NexconnApi) {
  if (botReady) return;
  await nx.issueToken(botId(), 'Hop');
  botReady = true;
}

export function assertCanSee(lobby: Pick<LobbyRow, 'is_demo' | 'demo_owner'>, viewer: UserRow): void {
  if (viewer.is_demo !== lobby.is_demo || (lobby.is_demo && lobby.demo_owner !== demoScope(viewer))) {
    throw new HttpError(404, 'not_found');
  }
}

export function istToday(now: Date): string {
  return new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

const LOBBY_COLS = `id, destination, direction, to_char(travel_date, 'YYYY-MM-DD') as travel_date, is_demo, demo_owner, channel_id, channel_ready`;

export async function ensureLobby(
  db: Db,
  nx: NexconnApi,
  k: { destination: DestKey; direction: Direction; date: string },
  user: UserRow,
): Promise<LobbyRow> {
  const owner = user.is_demo ? demoScope(user) : null;
  const find = () =>
    db.query<LobbyRow & { channel_ready: boolean }>(
      `select ${LOBBY_COLS} from hop.lobbies
        where destination = $1 and direction = $2 and travel_date = $3 and is_demo = $4 and demo_owner is not distinct from $5`,
      [k.destination, k.direction, k.date, user.is_demo, owner],
    );
  let rows = await find();
  if (!rows[0]) {
    const id = randomUUID();
    await db.query(
      `insert into hop.lobbies(id, destination, direction, travel_date, is_demo, demo_owner, channel_id)
       values ($1,$2,$3,$4,$5,$6,$7) on conflict do nothing`,
      [id, k.destination, k.direction, k.date, user.is_demo, owner, lobbyChannelId(id)],
    );
    rows = await find();
  }
  const lobby = rows[0];
  if (!lobby.channel_ready) {
    await ensureBot(nx);
    await nx.createGroup({
      channelId: lobby.channel_id,
      name: lobbyTitle(DESTINATIONS[lobby.destination].label, lobby.direction, lobby.travel_date).slice(0, 64),
      owner: botId(),
    });
    await db.query('update hop.lobbies set channel_ready = true where id = $1', [lobby.id]);
  }
  return lobby;
}

export type IntentInput = { destination: DestKey; direction: Direction; date: string; window: WindowKey; bags: number };

export async function postIntent(
  db: Db,
  nx: NexconnApi,
  user: UserRow,
  i: IntentInput,
  now: Date = new Date(),
): Promise<{ lobbyId: string; intentId: string; created: boolean }> {
  if (!(i.destination in DESTINATIONS) || !['out', 'back'].includes(i.direction) || !WINDOW_KEYS.includes(i.window)) {
    throw new HttpError(400, 'bad_request');
  }
  if (!Number.isInteger(i.bags) || i.bags < 0 || i.bags > 6) throw new HttpError(400, 'bad_request');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || i.date < istToday(now) || i.date > MAX_TRIP_DATE) {
    throw new HttpError(400, 'date_out_of_range');
  }

  const lobby = await ensureLobby(db, nx, i, user);
  await nx.joinGroup(lobby.channel_id, [user.nexconn_id]);

  const rows = await db.query<{ id: string; created: boolean }>(
    `insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,$3,$4)
     on conflict (user_id, lobby_id) do update set window_key = excluded.window_key, bags = excluded.bags, updated_at = now()
     returning id, (xmax = 0) as created`,
    [user.id, lobby.id, i.window, i.bags],
  );
  const intent = rows[0];
  const card: HopIntent = {
    intentId: intent.id,
    nexconnId: user.nexconn_id,
    name: user.name,
    hall: user.hall,
    window: i.window,
    bags: i.bags,
    isDemo: user.is_demo,
  };
  const messageId = await nx.sendGroupMessage({ fromUserId: user.nexconn_id, channelId: lobby.channel_id, messageType: CARD_INTENT, content: card });
  await db.query('update hop.intents set message_id = $2 where id = $1', [intent.id, messageId]);
  return { lobbyId: lobby.id, intentId: intent.id, created: intent.created };
}

export async function getLobby(db: Db, lobbyId: string): Promise<LobbyRow> {
  if (!/^[0-9a-f-]{36}$/i.test(lobbyId)) throw new HttpError(404, 'not_found');
  const rows = await db.query<LobbyRow>(`select ${LOBBY_COLS} from hop.lobbies where id = $1`, [lobbyId]);
  if (!rows[0]) throw new HttpError(404, 'not_found');
  return rows[0];
}

export type LobbySummary = {
  lobby: LobbyRow;
  going: number;
  windows: Partial<Record<WindowKey, number>>;
  openProposals: number;
  lockedProposals: number;
  members: { nexconnId: string; name: string }[];
  myIntent: { window: WindowKey; bags: number } | null;
};

export async function lobbySummary(db: Db, lobbyId: string, viewer: UserRow): Promise<LobbySummary> {
  const lobby = await getLobby(db, lobbyId);
  assertCanSee(lobby, viewer);
  const intents = await db.query<{ user_id: string; window_key: WindowKey; bags: number; name: string; nexconn_id: string }>(
    `select i.user_id, i.window_key, i.bags, u.name, u.nexconn_id from hop.intents i join hop.users u on u.id = i.user_id
      where i.lobby_id = $1 order by i.created_at`,
    [lobbyId],
  );
  const windows: Partial<Record<WindowKey, number>> = {};
  for (const r of intents) windows[r.window_key] = (windows[r.window_key] ?? 0) + 1;
  const counts = await db.query<{ status: string; n: string }>(
    `select status, count(*)::text n from hop.proposals where lobby_id = $1 group by status`,
    [lobbyId],
  );
  const n = (s: string) => parseInt(counts.find((c) => c.status === s)?.n ?? '0', 10);
  const mine = intents.find((r) => r.user_id === viewer.id);
  return {
    lobby,
    going: intents.length,
    windows,
    openProposals: n('open'),
    lockedProposals: n('locked'),
    members: intents.map((r) => ({ nexconnId: r.nexconn_id, name: r.name })),
    myIntent: mine ? { window: mine.window_key, bags: mine.bags } : null,
  };
}

export async function listMyTrips(
  db: Db,
  user: UserRow,
): Promise<{ lobbyId: string; title: string; date: string; podId: string | null; podStatus: string | null }[]> {
  const rows = await db.query<{ lobby_id: string; destination: DestKey; direction: Direction; travel_date: string; pod_id: string | null; pod_status: string | null }>(
    `select distinct on (l.id) l.id as lobby_id, l.destination, l.direction, to_char(l.travel_date, 'YYYY-MM-DD') as travel_date, pd.id as pod_id, pd.status as pod_status
       from hop.intents i
       join hop.lobbies l on l.id = i.lobby_id
       left join hop.proposals pr on pr.lobby_id = l.id and pr.status = 'locked'
       left join hop.pods pd on pd.proposal_id = pr.id and exists (
         select 1 from hop.pod_members pm where pm.pod_id = pd.id and pm.user_id = $1 and pm.status = 'in')
      where i.user_id = $1
      order by l.id, pd.id nulls last`,
    [user.id],
  );
  rows.sort((a, b) => a.travel_date.localeCompare(b.travel_date) || a.lobby_id.localeCompare(b.lobby_id));
  return rows.map((r) => ({
    lobbyId: r.lobby_id,
    title: lobbyTitle(DESTINATIONS[r.destination].label, r.direction, r.travel_date),
    date: r.travel_date,
    podId: r.pod_id,
    podStatus: r.pod_status,
  }));
}
