import { getDb } from '@/server/db';
import { demoTravellerLeaves } from '@/server/demo';
import { toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { requireUser } from '@/server/session';

export async function POST() {
  try {
    const user = await requireUser();
    await demoTravellerLeaves(getDb(), getNexconnApi(), user);
    return Response.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
