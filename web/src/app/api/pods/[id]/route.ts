import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { getPod } from '@/server/pods';
import { requireUser } from '@/server/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    return Response.json(await getPod(getDb(), getNexconnApi(), user, id));
  } catch (e) {
    return toResponse(e);
  }
}
