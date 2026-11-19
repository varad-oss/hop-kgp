import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { computeStats } from '@/server/stats';

export async function GET() {
  await connection();
  try {
    return Response.json(await computeStats(getDb()), { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (e) {
    return toResponse(e);
  }
}
