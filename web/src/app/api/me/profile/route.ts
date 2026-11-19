import { updateProfile } from '@/server/auth';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { requireUser } from '@/server/session';

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as { hall?: unknown; phone?: unknown } | null;
    if (typeof body?.hall !== 'string' || typeof body?.phone !== 'string') throw new HttpError(400, 'bad_request');
    const u = await updateProfile(getDb(), user.id, { hall: body.hall, phone: body.phone });
    return Response.json({ hall: u.hall, hasPhone: !!u.phone });
  } catch (e) {
    return toResponse(e);
  }
}
