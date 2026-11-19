import { DESTINATIONS, type DestKey, type Direction, type VehicleKey } from '@/domain/catalog';
import { CARD_TICKET, type HopTicket } from '@/domain/cards';
import { formatTime } from '@/domain/copy';
import { splitFare } from '@/domain/fare';
import type { UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import { botId, ensureBot } from './lobbies';
import { mirrorProposal } from './mirror';
import type { NexconnApi } from './nexconn/api';

type PodRow = {
  id: string;
  proposal_id: string;
  channel_id: string;
  status: 'pending' | 'live' | 'archived';
  ticket_message_id: string | null;
  depart_at: string;
};

async function loadPod(db: Db, podId: string): Promise<PodRow | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(podId)) return undefined;
  return (
    await db.query<PodRow>(
      `select pd.id, pd.proposal_id, pd.channel_id, pd.status, pd.ticket_message_id, pr.depart_at::text as depart_at
         from hop.pods pd join hop.proposals pr on pr.id = pd.proposal_id where pd.id = $1`,
      [podId],
    )
  )[0];
}

export async function buildTicket(db: Db, podId: string, reason?: HopTicket['reason']): Promise<HopTicket> {
  const r = (
    await db.query<{
      proposal_id: string;
      destination: DestKey;
      direction: Direction;
      depart_at: string;
      meeting_point: string;
      vehicle: VehicleKey;
      total_fare: number;
      seats: number;
      is_demo: boolean;
    }>(
      `select pr.id as proposal_id, l.destination, l.direction, to_char(pr.depart_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as depart_at,
              pr.meeting_point, pr.vehicle, pr.total_fare, pr.seats, l.is_demo
         from hop.pods pd join hop.proposals pr on pr.id = pd.proposal_id join hop.lobbies l on l.id = pr.lobby_id where pd.id = $1`,
      [podId],
    )
  )[0];
  if (!r) throw new HttpError(404, 'not_found');
  const members = await db.query<{ nexconn_id: string; name: string; hall: string | null; phone: string | null }>(
    `select u.nexconn_id, u.name, u.hall, u.phone from hop.pod_members pm join hop.users u on u.id = pm.user_id
      where pm.pod_id = $1 and pm.status = 'in' order by pm.joined_at, u.name`,
    [podId],
  );
  const { each, over } = members.length ? splitFare(r.total_fare, members.length) : { each: r.total_fare, over: 0 };
  return {
    podId,
    proposalId: r.proposal_id,
    destination: r.destination,
    direction: r.direction,
    departAt: r.depart_at,
    meetingPoint: r.meeting_point,
    vehicle: r.vehicle,
    totalFare: r.total_fare,
    each,
    over,
    seats: r.seats,
    freeSeats: Math.max(0, r.seats - members.length),
    members: members.map((m) => ({
      nexconnId: m.nexconn_id,
      name: m.name,
      hall: m.hall,
      phone: r.is_demo ? 'Demo number' : (m.phone ?? ''),
    })),
    ...(reason ? { reason } : {}),
    isDemo: r.is_demo,
  };
}

/** Creates the Nexconn group, joins the members and posts the first Trip Ticket. Safe to call repeatedly. */
export async function ensurePodMaterialized(db: Db, nx: NexconnApi, podId: string): Promise<{ status: 'pending' | 'live' | 'archived' }> {
  const leased = await db.query<{ channel_id: string; proposal_id: string; ticket_message_id: string | null }>(
    `update hop.pods set lease_until = now() + interval '30 seconds'
      where id = $1 and status = 'pending' and (lease_until is null or lease_until < now())
      returning channel_id, proposal_id, ticket_message_id`,
    [podId],
  );
  if (!leased[0]) {
    const cur = await loadPod(db, podId);
    return { status: cur?.status ?? 'pending' };
  }
  const { channel_id, proposal_id } = leased[0];
  let ticketId = leased[0].ticket_message_id;
  try {
    const ids = (
      await db.query<{ nexconn_id: string }>(
        `select u.nexconn_id from hop.pod_members pm join hop.users u on u.id = pm.user_id where pm.pod_id = $1 and pm.status = 'in'`,
        [podId],
      )
    ).map((r) => r.nexconn_id);
    const ticket = await buildTicket(db, podId);
    await ensureBot(nx);
    await nx.createGroup({
      channelId: channel_id,
      name: `${DESTINATIONS[ticket.destination].short} ${formatTime(ticket.departAt)}`.slice(0, 64),
      owner: botId(),
    });
    await nx.joinGroup(channel_id, ids);
    if (!ticketId) {
      ticketId = await nx.sendGroupMessage({ fromUserId: botId(), channelId: channel_id, messageType: CARD_TICKET, content: ticket, needReadReceipt: true });
      await db.query('update hop.pods set ticket_message_id = $2 where id = $1', [podId, ticketId]);
    }
    await mirrorProposal(db, nx, proposal_id);
    await db.query(`update hop.pods set status = 'live', lease_until = null where id = $1`, [podId]);
    return { status: 'live' };
  } catch (e) {
    console.error('pod materialization failed', e);
    await db.query('update hop.pods set lease_until = null where id = $1', [podId]);
    return { status: 'pending' };
  }
}

/** Posts a fresh Trip Ticket after the roster changes. */
export async function resendTicket(db: Db, nx: NexconnApi, podId: string, reason: NonNullable<HopTicket['reason']>): Promise<void> {
  const pod = await loadPod(db, podId);
  if (!pod || pod.status !== 'live') return;
  const ticket = await buildTicket(db, podId, reason);
  const id = await nx.sendGroupMessage({ fromUserId: botId(), channelId: pod.channel_id, messageType: CARD_TICKET, content: ticket, needReadReceipt: true });
  await db.query('update hop.pods set ticket_message_id = $2 where id = $1', [podId, id]);
}

export async function getPod(
  db: Db,
  nx: NexconnApi,
  user: UserRow,
  podId: string,
  now: Date = new Date(),
): Promise<{ status: 'pending' | 'live' | 'archived'; channelId: string; ticket: HopTicket }> {
  let pod = await loadPod(db, podId);
  const member = pod && (await db.query('select 1 from hop.pod_members where pod_id = $1 and user_id = $2 and status = $3', [podId, user.id, 'in']))[0];
  if (!pod || !member) throw new HttpError(404, 'not_found');
  if (pod.status === 'pending') {
    await ensurePodMaterialized(db, nx, podId);
    pod = (await loadPod(db, podId))!;
  }
  let status = pod.status;
  if (status !== 'archived' && now.getTime() > new Date(pod.depart_at).getTime() + 24 * 3600_000) {
    await db.query(`update hop.pods set status = 'archived' where id = $1`, [podId]);
    status = 'archived';
  }
  return { status, channelId: pod.channel_id, ticket: await buildTicket(db, podId) };
}

export async function saveFeedback(db: Db, user: UserRow, f: { podId: string; rating: number; note: string }): Promise<void> {
  const note = (f.note ?? '').trim();
  if (!Number.isInteger(f.rating) || f.rating < 1 || f.rating > 5 || note.length > 280) throw new HttpError(400, 'bad_request');
  if (!/^[0-9a-f-]{36}$/i.test(f.podId)) throw new HttpError(404, 'not_found');
  const member = await db.query('select 1 from hop.pod_members where pod_id = $1 and user_id = $2', [f.podId, user.id]);
  if (!member[0]) throw new HttpError(404, 'not_found');
  await db.query('delete from hop.feedback where pod_id = $1 and user_id = $2', [f.podId, user.id]);
  await db.query('insert into hop.feedback(user_id, pod_id, rating, note) values ($1,$2,$3,$4)', [user.id, f.podId, f.rating, note || null]);
}
