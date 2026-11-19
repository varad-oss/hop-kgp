import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { lobbySummary } from '@/server/lobbies';
import { requireUser } from '@/server/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { lobby, ...rest } = await lobbySummary(getDb(), id, user);
    return Response.json({ lobby: { id: lobby.id, destination: lobby.destination, direction: lobby.direction, date: lobby.travel_date, channelId: lobby.channel_id }, ...rest });
  } catch (e) {
    return toResponse(e);
  }
}
