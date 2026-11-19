import type { Db } from './db';

/** Returns true when the request is within the limit, false when it should be rejected. */
export async function hitRateLimit(db: Db, key: string, limit: number, windowSec: number): Promise<boolean> {
  const rows = await db.query<{ count: number }>(
    `insert into hop.rate_limits(key, window_start, count) values ($1, now(), 1)
     on conflict (key) do update set
       count = case when hop.rate_limits.window_start < now() - make_interval(secs => $2) then 1 else hop.rate_limits.count + 1 end,
       window_start = case when hop.rate_limits.window_start < now() - make_interval(secs => $2) then now() else hop.rate_limits.window_start end
     returning count`,
    [key, windowSec],
  );
  return rows[0].count <= limit;
}
