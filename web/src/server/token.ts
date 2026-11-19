import type { UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import type { NexconnApi } from './nexconn/api';
import { hitRateLimit } from './rateLimit';

export async function handleToken(d: { db: Db; nx: NexconnApi; user: UserRow }): Promise<{ token: string; userId: string }> {
  if (!(await hitRateLimit(d.db, `token:${d.user.id}`, 10, 60))) throw new HttpError(429, 'slow_down');
  const token = await d.nx.issueToken(d.user.nexconn_id, d.user.name);
  return { token, userId: d.user.nexconn_id };
}
