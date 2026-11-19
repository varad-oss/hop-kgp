import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { saveFeedback } from '@/server/pods';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getDb();
    if (!(await hitRateLimit(db, `feedback:${user.id}`, 10, 60))) throw new HttpError(429, 'slow_down');
    const b = (await req.json().catch(() => null)) as { podId?: string; rating?: number; note?: string } | null;
    if (!b) throw new HttpError(400, 'bad_request');
    await saveFeedback(db, user, { podId: String(b.podId), rating: Number(b.rating), note: String(b.note ?? '') });
    return Response.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
