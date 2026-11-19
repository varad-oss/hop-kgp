import { connection } from 'next/server';
import { toResponse } from '@/server/http';
import { requireUser } from '@/server/session';

export async function GET() {
  await connection();
  try {
    const u = await requireUser();
    return Response.json({ id: u.id, nexconnId: u.nexconn_id, name: u.name, hall: u.hall, hasPhone: !!u.phone, isDemo: u.is_demo });
  } catch (e) {
    return toResponse(e);
  }
}
