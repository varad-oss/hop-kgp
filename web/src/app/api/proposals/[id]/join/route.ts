import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { joinProposal } from '@/server/proposals';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `act:${user.id}`, 30, 60))) throw new HttpError(429, 'slow_down');
    const { id } = await ctx.params;
    return Response.json(await joinProposal(getDb(), getNexconnApi(), user, id));
  } catch (e) {
    return toResponse(e);
  }
}
