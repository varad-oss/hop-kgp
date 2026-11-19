import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { postIntent, type IntentInput } from '@/server/lobbies';
import { getNexconnApi } from '@/server/nexconn/api';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getDb();
    if (!(await hitRateLimit(db, `intent:${user.id}`, 10, 60))) throw new HttpError(429, 'slow_down');
    const body = (await req.json().catch(() => null)) as IntentInput | null;
    if (!body) throw new HttpError(400, 'bad_request');
    const { lobbyId } = await postIntent(db, getNexconnApi(), user, {
      destination: body.destination,
      direction: body.direction,
      date: body.date,
      window: body.window,
      bags: body.bags,
    });
    return Response.json({ lobbyId });
  } catch (e) {
    return toResponse(e);
  }
}
