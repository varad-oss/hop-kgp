import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { listMyTrips } from '@/server/lobbies';
import { requireUser } from '@/server/session';

export async function GET() {
  await connection();
  try {
    const user = await requireUser();
    return Response.json({ trips: await listMyTrips(getDb(), user) });
  } catch (e) {
    return toResponse(e);
  }
}
