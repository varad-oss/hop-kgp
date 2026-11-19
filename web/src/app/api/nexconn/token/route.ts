import { getDb } from '@/server/db';
import { toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { requireUser } from '@/server/session';
import { handleToken } from '@/server/token';

export async function POST() {
  try {
    const user = await requireUser();
    return Response.json(await handleToken({ db: getDb(), nx: getNexconnApi(), user }));
  } catch (e) {
    return toResponse(e);
  }
}
