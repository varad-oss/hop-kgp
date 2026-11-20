import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { getPod } from '@/server/pods';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `pod:${user.id}`, 120, 60))) throw new HttpError(429, 'slow_down');
    const { id } = await ctx.params;
    return Response.json(await getPod(getDb(), getNexconnApi(), user, id));
  } catch (e) {
    return toResponse(e);
  }
}
