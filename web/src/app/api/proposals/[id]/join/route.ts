import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { joinProposal } from '@/server/proposals';
import { requireUser } from '@/server/session';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    return Response.json(await joinProposal(getDb(), getNexconnApi(), user, id));
  } catch (e) {
    return toResponse(e);
  }
}
