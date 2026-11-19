import { DESTINATIONS, type DestKey } from '@/domain/catalog';
import { formatTime, formatTripDate } from '@/domain/copy';
import { formatINR, splitFare } from '@/domain/fare';
import type { Db } from './db';
import { proposalMeta } from './mirror';

export type Peek = { line: string; lobbyId: string; destination: DestKey; date: string; time: string };

/** Public, privacy-safe summary of a proposal: counts only, no names, halls or phones. */
export async function peek(db: Db, proposalId: string): Promise<Peek | null> {
  if (!/^[0-9a-f-]{36}$/i.test(proposalId)) return null;
  const r = (
    await db.query<{ lobby_id: string; destination: DestKey; date: string; depart_at: string; total_fare: number; seats: number; status: string; is_demo: boolean }>(
      `select pr.lobby_id, l.destination, to_char(l.travel_date, 'YYYY-MM-DD') as date,
              to_char(pr.depart_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as depart_at, pr.total_fare, pr.seats, pr.status, l.is_demo
         from hop.proposals pr join hop.lobbies l on l.id = pr.lobby_id where pr.id = $1`,
      [proposalId],
    )
  )[0];
  if (!r || r.is_demo || r.status === 'cancelled') return null;
  const meta = await proposalMeta(db, proposalId);
  const time = formatTime(r.depart_at);
  const where = `${DESTINATIONS[r.destination].label} ${formatTripDate(r.date)}, ${time}`;
  const free = r.seats - meta.inCount;
  const each = formatINR(splitFare(r.total_fare, Math.max(1, meta.inCount)).each);
  const head = free <= 0 ? `Full · ${each} each` : `${meta.inCount} ${r.status === 'locked' ? 'going' : 'in'} · ${each} each · ${free} seat${free === 1 ? '' : 's'} left`;
  return { line: `${head} · ${where}`, lobbyId: r.lobby_id, destination: r.destination, date: r.date, time };
}
