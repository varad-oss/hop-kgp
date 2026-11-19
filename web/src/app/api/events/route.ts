import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

const NAMES = ['link_open', 'intent_sent', 'lock_done'];

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getDb();
    if (!(await hitRateLimit(db, `event:${user.id}`, 30, 60))) throw new HttpError(429, 'slow_down');
    const b = (await req.json().catch(() => null)) as { name?: string; ms?: number } | null;
    if (!b?.name || !NAMES.includes(b.name)) throw new HttpError(400, 'bad_request');
    const ms = Number.isFinite(b.ms) && b.ms! >= 0 && b.ms! < 3_600_000 ? Math.round(b.ms!) : null;
    await db.query('insert into hop.events(user_id, name, ms) values ($1,$2,$3)', [user.id, b.name, ms]);
    return Response.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
