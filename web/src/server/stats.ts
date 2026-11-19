import type { Db } from './db';

export type Stats = {
  students: number;
  tripsLocked: number;
  rupeesSaved: number;
  lobbies: number;
  returnTripsPosted: number;
  medianLinkToIntentMs: number | null;
  daily: { date: string; signups: number; locks: number }[];
};

const n = (v: unknown) => parseInt(String(v ?? 0), 10) || 0;

/** Every figure excludes demo users, lobbies and pods. */
export async function computeStats(db: Db): Promise<Stats> {
  const [row] = await db.query<Record<string, string | null>>(
    `select
       (select count(*) from hop.users where not is_demo) as students,
       (select count(*) from hop.pods pd join hop.proposals pr on pr.id = pd.proposal_id join hop.lobbies l on l.id = pr.lobby_id where not l.is_demo) as trips,
       (select coalesce(sum(pr.total_fare * (m.cnt - 1)), 0) from hop.pods pd
          join hop.proposals pr on pr.id = pd.proposal_id join hop.lobbies l on l.id = pr.lobby_id
          join lateral (select count(*) cnt from hop.pod_members where pod_id = pd.id and status = 'in') m on true
         where not l.is_demo and pd.status in ('live','archived') and m.cnt > 1) as saved,
       (select count(*) from hop.lobbies where not is_demo) as lobbies,
       (select count(*) from hop.intents i join hop.lobbies l on l.id = i.lobby_id join hop.users u on u.id = i.user_id
         where l.direction = 'back' and not l.is_demo and not u.is_demo) as returns,
       (select count(*) from hop.events e join hop.users u on u.id = e.user_id where e.name = 'intent_sent' and e.ms is not null and not u.is_demo) as samples,
       (select percentile_cont(0.5) within group (order by e.ms) from hop.events e join hop.users u on u.id = e.user_id
         where e.name = 'intent_sent' and e.ms is not null and not u.is_demo) as median`,
  );
  const days = await db.query<{ date: string; signups: string; locks: string }>(
    `with s as (select (created_at at time zone 'Asia/Kolkata')::date d, count(*) c from hop.users where not is_demo group by 1),
          k as (select (pd.created_at at time zone 'Asia/Kolkata')::date d, count(*) c from hop.pods pd
                  join hop.proposals pr on pr.id = pd.proposal_id join hop.lobbies l on l.id = pr.lobby_id where not l.is_demo group by 1)
     select to_char(coalesce(s.d, k.d), 'YYYY-MM-DD') as date, coalesce(s.c, 0)::text as signups, coalesce(k.c, 0)::text as locks
       from s full join k on s.d = k.d order by 1`,
  );
  return {
    students: n(row.students),
    tripsLocked: n(row.trips),
    rupeesSaved: n(row.saved),
    lobbies: n(row.lobbies),
    returnTripsPosted: n(row.returns),
    medianLinkToIntentMs: n(row.samples) >= 5 && row.median != null ? Math.round(Number(row.median)) : null,
    daily: days.map((d) => ({ date: d.date, signups: n(d.signups), locks: n(d.locks) })),
  };
}
