import { DESTINATIONS, MAX_TRIP_DATE, type DestKey, type Direction } from '@/domain/catalog';
import { lobbyTitle } from '@/domain/copy';
import { splitFare } from '@/domain/fare';
import type { UserRow } from './auth';
import type { Db } from './db';
import { istToday } from './lobbies';

export type TripStage = 'locked' | 'lock_ready' | 'waiting' | 'pick_plan' | 'no_plans' | 'ended';

export type TripOverview = {
  lobbyId: string;
  title: string;
  destination: DestKey;
  direction: Direction;
  date: string;
  going: number;
  openPlans: number;
  past: boolean;
  stage: TripStage;
  myPlan: { proposalId: string; inCount: number; seats: number; departAt: string; meetingPoint: string } | null;
  trip: { podId: string; status: 'pending' | 'live' | 'archived'; departAt: string; meetingPoint: string; people: number; each: number } | null;
};

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Everything the Trips home needs, for one user's rooms from 7 days ago onward. */
export async function tripsOverview(db: Db, user: UserRow, now: Date = new Date()): Promise<TripOverview[]> {
  const today = istToday(now);
  const rows = await db.query<{
    lobby_id: string;
    destination: DestKey;
    direction: Direction;
    travel_date: string;
    going: string;
    open_plans: string;
    my_prop: string | null;
    my_in: string | null;
    my_seats: number | null;
    my_depart: string | null;
    my_point: string | null;
    pod_id: string | null;
    pod_status: 'pending' | 'live' | 'archived' | null;
    pod_depart: string | null;
    pod_point: string | null;
    pod_people: string | null;
    pod_fare: number | null;
  }>(
    `select l.id as lobby_id, l.destination, l.direction, to_char(l.travel_date, 'YYYY-MM-DD') as travel_date,
            (select count(*) from hop.intents x where x.lobby_id = l.id)::text as going,
            (select count(*) from hop.proposals p where p.lobby_id = l.id and p.status = 'open')::text as open_plans,
            mp.id as my_prop, mp.in_count::text as my_in, mp.seats as my_seats,
            to_char(mp.depart_at at time zone 'UTC', ${ISO}) as my_depart, mp.meeting_point as my_point,
            pd.id as pod_id, pd.status as pod_status,
            to_char(pr.depart_at at time zone 'UTC', ${ISO}) as pod_depart, pr.meeting_point as pod_point,
            (select count(*) from hop.pod_members m where m.pod_id = pd.id and m.status = 'in')::text as pod_people,
            pr.total_fare as pod_fare
       from hop.intents i
       join hop.lobbies l on l.id = i.lobby_id
       left join lateral (
         select p.id, p.seats, p.depart_at, p.meeting_point,
                (select count(*) from hop.votes v2 where v2.proposal_id = p.id) as in_count
           from hop.proposals p join hop.votes v on v.proposal_id = p.id and v.user_id = $1
          where p.lobby_id = l.id and p.status = 'open'
          order by p.created_at limit 1) mp on true
       left join lateral (
         select pd.* from hop.pods pd join hop.proposals p on p.id = pd.proposal_id
          where p.lobby_id = l.id and exists (select 1 from hop.pod_members m where m.pod_id = pd.id and m.user_id = $1 and m.status = 'in')
          limit 1) pd on true
       left join hop.proposals pr on pr.id = pd.proposal_id
      where i.user_id = $1 and l.travel_date >= $2::date
      order by l.travel_date, l.id`,
    [user.id, addDays(today, -7)],
  );
  return rows.map((r) => {
    const past = r.travel_date < today || r.pod_status === 'archived';
    const people = parseInt(r.pod_people ?? '0', 10);
    const trip = r.pod_id
      ? { podId: r.pod_id, status: r.pod_status!, departAt: r.pod_depart!, meetingPoint: r.pod_point!, people, each: splitFare(r.pod_fare!, Math.max(1, people)).each }
      : null;
    const myPlan = r.my_prop
      ? { proposalId: r.my_prop, inCount: parseInt(r.my_in ?? '0', 10), seats: r.my_seats!, departAt: r.my_depart!, meetingPoint: r.my_point! }
      : null;
    const openPlans = parseInt(r.open_plans, 10);
    const stage: TripStage = trip
      ? past
        ? 'ended'
        : 'locked'
      : past
        ? 'ended'
        : myPlan
          ? myPlan.inCount >= 2
            ? 'lock_ready'
            : 'waiting'
          : openPlans > 0
            ? 'pick_plan'
            : 'no_plans';
    return {
      lobbyId: r.lobby_id,
      title: lobbyTitle(DESTINATIONS[r.destination].label, r.direction, r.travel_date),
      destination: r.destination,
      direction: r.direction,
      date: r.travel_date,
      going: parseInt(r.going, 10),
      openPlans,
      past,
      stage,
      myPlan,
      trip,
    };
  });
}

export type Departure = {
  lobbyId: string;
  destination: DestKey;
  direction: Direction;
  date: string;
  going: number;
  openPlans: number;
  lockedPlans: number;
  firstDepartAt: string | null;
  mine: boolean;
};

/** Upcoming real rooms with counts only (no names), for the Departures board. */
export async function departures(db: Db, viewer: UserRow | null, now: Date = new Date()): Promise<Departure[]> {
  const rows = await db.query<{
    lobby_id: string;
    destination: DestKey;
    direction: Direction;
    travel_date: string;
    going: string;
    open_plans: string;
    locked_plans: string;
    first_depart: string | null;
    mine: boolean;
  }>(
    `select l.id as lobby_id, l.destination, l.direction, to_char(l.travel_date, 'YYYY-MM-DD') as travel_date,
            (select count(*) from hop.intents x where x.lobby_id = l.id)::text as going,
            (select count(*) from hop.proposals p where p.lobby_id = l.id and p.status = 'open')::text as open_plans,
            (select count(*) from hop.proposals p where p.lobby_id = l.id and p.status = 'locked')::text as locked_plans,
            (select to_char(min(p.depart_at) at time zone 'UTC', ${ISO}) from hop.proposals p
              where p.lobby_id = l.id and p.status in ('open','locked') and p.depart_at > $2) as first_depart,
            exists (select 1 from hop.intents x where x.lobby_id = l.id and x.user_id = $1::uuid) as mine
       from hop.lobbies l
      where not l.is_demo and l.travel_date between $3::date and $4::date
        and exists (select 1 from hop.intents x where x.lobby_id = l.id)
      order by l.travel_date, l.direction, l.destination
      limit 300`,
    [viewer?.id ?? null, now.toISOString(), istToday(now), MAX_TRIP_DATE],
  );
  return rows.map((r) => ({
    lobbyId: r.lobby_id,
    destination: r.destination,
    direction: r.direction,
    date: r.travel_date,
    going: parseInt(r.going, 10),
    openPlans: parseInt(r.open_plans, 10),
    lockedPlans: parseInt(r.locked_plans, 10),
    firstDepartAt: r.first_depart,
    mine: r.mine,
  }));
}
