import type { ProposalMeta } from '@/domain/cards';
import type { Db } from './db';
import { botId } from './bot';
import type { NexconnApi } from './nexconn/api';

/** Reads the live state of a proposal from Postgres (the source of truth). */
export async function proposalMeta(db: Db, proposalId: string): Promise<ProposalMeta> {
  const p = (await db.query<{ status: ProposalMeta['status'] }>('select status from hop.proposals where id = $1', [proposalId]))[0];
  if (!p) return { status: 'cancelled', inCount: 0, bags: 0, voters: [], podId: null };
  const pod = (await db.query<{ id: string }>('select id from hop.pods where proposal_id = $1', [proposalId]))[0];
  const people =
    p.status === 'locked' && pod
      ? await db.query<{ nexconn_id: string; bags: number | null }>(
          `select u.nexconn_id, i.bags from hop.pod_members pm join hop.users u on u.id = pm.user_id
             join hop.proposals pr on pr.id = $2 left join hop.intents i on i.user_id = u.id and i.lobby_id = pr.lobby_id
            where pm.pod_id = $1 and pm.status = 'in' order by pm.joined_at`,
          [pod.id, proposalId],
        )
      : await db.query<{ nexconn_id: string; bags: number | null }>(
          `select u.nexconn_id, i.bags from hop.votes v join hop.users u on u.id = v.user_id
             join hop.proposals pr on pr.id = v.proposal_id left join hop.intents i on i.user_id = u.id and i.lobby_id = pr.lobby_id
            where v.proposal_id = $1 order by v.created_at`,
          [proposalId],
        );
  return {
    status: p.status,
    inCount: people.length,
    bags: people.reduce((n, r) => n + (r.bags ?? 0), 0),
    voters: people.map((r) => r.nexconn_id),
    podId: pod?.id ?? null,
  };
}

/** Pushes the proposal's current state onto its Hop:Proposal message as metadata so every client updates live. */
export async function mirrorProposal(db: Db, nx: NexconnApi, proposalId: string): Promise<void> {
  const row = (
    await db.query<{ message_id: string | null; channel_id: string }>(
      `select pr.message_id, l.channel_id from hop.proposals pr join hop.lobbies l on l.id = pr.lobby_id where pr.id = $1`,
      [proposalId],
    )
  )[0];
  if (!row?.message_id) return;
  const m = await proposalMeta(db, proposalId);
  await nx.setMessageMetadata({
    messageId: row.message_id,
    channelId: row.channel_id,
    userId: botId(),
    metadata: {
      status: m.status,
      inCount: String(m.inCount),
      bags: String(m.bags),
      voters: m.voters.join(','),
      ...(m.podId ? { podId: m.podId } : {}),
    },
  });
}
