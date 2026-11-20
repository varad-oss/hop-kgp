import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { lobbySummary } from '@/server/lobbies';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `summary:${user.id}`, 120, 60))) throw new HttpError(429, 'slow_down');
    const { id } = await ctx.params;
    const { lobby, ...rest } = await lobbySummary(getDb(), id, user);
    return Response.json({ lobby: { id: lobby.id, destination: lobby.destination, direction: lobby.direction, date: lobby.travel_date, channelId: lobby.channel_id, isDemo: lobby.is_demo }, ...rest });
  } catch (e) {
    return toResponse(e);
  }
}
