import { getDb } from '@/server/db';
import { demoExists, startDemo } from '@/server/demo';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getDb();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    // Opening an existing sandbox is free; only creating new ones is limited per IP.
    if (!(await demoExists(db, user)) && !(await hitRateLimit(db, `demo:${ip}`, 20, 3600))) throw new HttpError(429, 'slow_down');
    return Response.json(await startDemo(db, getNexconnApi(), user));
  } catch (e) {
    return toResponse(e);
  }
}
