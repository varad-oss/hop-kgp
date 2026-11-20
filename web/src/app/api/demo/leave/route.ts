import { getDb } from '@/server/db';
import { demoTravellerLeaves } from '@/server/demo';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function POST() {
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `demoleave:${user.id}`, 10, 60))) throw new HttpError(429, 'slow_down');
    await demoTravellerLeaves(getDb(), getNexconnApi(), user);
    return Response.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
