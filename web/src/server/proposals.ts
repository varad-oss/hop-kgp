import { randomUUID } from 'node:crypto';
import { CARD_PROPOSAL, type HopProposal } from '@/domain/cards';
import { VEHICLES, type VehicleKey } from '@/domain/catalog';
import type { UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import { assertCanSee, getLobby, istToday, type LobbyRow } from './lobbies';
import { mirrorProposal, proposalMeta } from './mirror';
import type { NexconnApi } from './nexconn/api';
import { ensurePodMaterialized, resendTicket } from './pods';

export { proposalMeta, mirrorProposal };

const HTTP: Record<string, number> = { full: 409, busy: 409, too_few: 409, departed: 410, closed: 410, not_in_lobby: 403, not_voter: 403 };

function assertOk(result: string) {
  if (HTTP[result]) throw new HttpError(HTTP[result], result);
}

function requireProfile(user: UserRow) {
  if (!user.hall || !user.phone) throw new HttpError(428, 'profile_required');
}

type ProposalRow = { id: string; lobby_id: string; status: string };

async function proposalAndLobby(db: Db, proposalId: string, viewer: UserRow): Promise<{ proposal: ProposalRow; lobby: LobbyRow }> {
  if (!/^[0-9a-f-]{36}$/i.test(proposalId)) throw new HttpError(404, 'not_found');
  const proposal = (await db.query<ProposalRow>('select id, lobby_id, status from hop.proposals where id = $1', [proposalId]))[0];
  if (!proposal) throw new HttpError(404, 'not_found');
  const lobby = await getLobby(db, proposal.lobby_id);
  assertCanSee(lobby, viewer);
  return { proposal, lobby };
}

export type ProposalInput = { lobbyId: string; departAt: string; meetingPoint: string; vehicle: VehicleKey; totalFare: number; seats: number };

export async function createProposal(db: Db, nx: NexconnApi, user: UserRow, p: ProposalInput, now: Date = new Date()): Promise<{ proposalId: string }> {
  requireProfile(user);
  const lobby = await getLobby(db, p.lobbyId);
  assertCanSee(lobby, user);
  const has = await db.query('select 1 from hop.intents where user_id = $1 and lobby_id = $2', [user.id, lobby.id]);
  if (!has[0]) throw new HttpError(403, 'not_in_lobby');

  const vehicle = VEHICLES[p.vehicle];
  const meetingPoint = String(p.meetingPoint ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!vehicle || !Number.isInteger(p.seats) || p.seats < 2 || p.seats > vehicle.seats) throw new HttpError(400, 'bad_request');
  if (meetingPoint.length < 1 || meetingPoint.length > 60) throw new HttpError(400, 'bad_request');
  if (!Number.isInteger(p.totalFare) || p.totalFare < 1 || p.totalFare > 20000) throw new HttpError(400, 'bad_request');
  const depart = new Date(p.departAt);
  if (Number.isNaN(depart.getTime()) || depart.getTime() <= now.getTime() || istToday(depart) !== lobby.travel_date) {
    throw new HttpError(400, 'bad_time');
  }

  const id = randomUUID();
  await db.query(
    `insert into hop.proposals(id, lobby_id, creator_id, depart_at, meeting_point, vehicle, total_fare, seats) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, lobby.id, user.id, depart.toISOString(), meetingPoint, p.vehicle, p.totalFare, p.seats],
  );
  const joined = (await db.query<{ result: string }>('select * from hop.join_proposal($1,$2,$3)', [id, user.id, now.toISOString()]))[0];
  if (joined.result !== 'joined') {
    await db.query('delete from hop.proposals where id = $1', [id]);
    assertOk(joined.result);
    throw new HttpError(400, 'bad_request');
  }
  const meta = await proposalMeta(db, id);
  const card: HopProposal = {
    proposalId: id,
    lobbyId: lobby.id,
    creatorName: user.name,
    departAt: depart.toISOString(),
    meetingPoint,
    vehicle: p.vehicle,
    totalFare: p.totalFare,
    seats: p.seats,
    isDemo: user.is_demo,
  };
  let messageId: string;
  try {
    messageId = await nx.sendGroupMessage({
      fromUserId: user.nexconn_id,
      channelId: lobby.channel_id,
      messageType: CARD_PROPOSAL,
      content: card,
      metadata: { status: meta.status, inCount: String(meta.inCount), bags: String(meta.bags), voters: meta.voters.join(',') },
    });
  } catch (e) {
    // Never leave a plan that exists in the DB but can never update live.
    await db.query('delete from hop.votes where proposal_id = $1', [id]);
    await db.query('delete from hop.proposals where id = $1', [id]);
    throw e;
  }
  await db.query('update hop.proposals set message_id = $2 where id = $1', [id, messageId]);
  return { proposalId: id };
}

export async function joinProposal(db: Db, nx: NexconnApi, user: UserRow, proposalId: string, now: Date = new Date()) {
  requireProfile(user);
  await proposalAndLobby(db, proposalId, user);
  const r = (await db.query<{ result: string; in_count: number; pod_id: string | null; moved_from: string | null }>('select * from hop.join_proposal($1,$2,$3)', [
    proposalId,
    user.id,
    now.toISOString(),
  ]))[0];
  assertOk(r.result);
  if (r.result === 'already' && r.pod_id) {
    // A retry after a Nexconn blip: make sure the member really is in the live pod channel.
    const st = await ensurePodMaterialized(db, nx, r.pod_id);
    if (st.status === 'live') await nx.joinGroup(`p${r.pod_id.replace(/-/g, '')}`, [user.nexconn_id]);
  }
  if (r.result === 'joined') {
    await mirrorProposal(db, nx, proposalId);
    if (r.moved_from) await mirrorProposal(db, nx, r.moved_from);
    if (r.pod_id) {
      const st = await ensurePodMaterialized(db, nx, r.pod_id);
      if (st.status === 'live') {
        await nx.joinGroup(`p${r.pod_id.replace(/-/g, '')}`, [user.nexconn_id]);
        await resendTicket(db, nx, r.pod_id, { kind: 'joined', name: user.name });
      }
    }
  }
  return { result: r.result, inCount: r.in_count, podId: r.pod_id };
}

export async function leaveProposal(db: Db, nx: NexconnApi, user: UserRow, proposalId: string, now: Date = new Date()) {
  await proposalAndLobby(db, proposalId, user);
  const r = (await db.query<{ result: string; in_count: number; pod_id: string | null }>('select * from hop.leave_proposal($1,$2,$3)', [
    proposalId,
    user.id,
    now.toISOString(),
  ]))[0];
  if (r.result === 'left') {
    await mirrorProposal(db, nx, proposalId);
    if (r.pod_id) {
      await nx.leaveGroup(`p${r.pod_id.replace(/-/g, '')}`, [user.nexconn_id]);
      if (r.in_count > 0) await resendTicket(db, nx, r.pod_id, { kind: 'left', name: user.name });
    }
  }
  return { result: r.result, inCount: r.in_count, podId: r.pod_id };
}

export async function lockProposal(db: Db, nx: NexconnApi, user: UserRow, proposalId: string, now: Date = new Date()) {
  await proposalAndLobby(db, proposalId, user);
  const r = (await db.query<{ result: string; pod_id: string | null }>('select * from hop.lock_proposal($1,$2,$3)', [proposalId, user.id, now.toISOString()]))[0];
  assertOk(r.result);
  if (r.pod_id) {
    await ensurePodMaterialized(db, nx, r.pod_id);
    if (r.result === 'locked') await mirrorProposal(db, nx, proposalId).catch((e) => console.error('mirror after lock failed', e));
  }
  return { result: r.result, podId: r.pod_id };
}
