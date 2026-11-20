import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { departures } from '@/server/overview';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function GET() {
  await connection();
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `departures:${user.id}`, 60, 60))) throw new HttpError(429, 'slow_down');
    return Response.json({ departures: await departures(getDb(), user) });
  } catch (e) {
    return toResponse(e);
  }
}
