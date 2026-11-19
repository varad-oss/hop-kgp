import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { hitRateLimit } from '@/server/rateLimit';
import { createProposal, type ProposalInput } from '@/server/proposals';
import { requireUser } from '@/server/session';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getDb();
    if (!(await hitRateLimit(db, `proposal:${user.id}`, 20, 60))) throw new HttpError(429, 'slow_down');
    const b = (await req.json().catch(() => null)) as ProposalInput | null;
    if (!b) throw new HttpError(400, 'bad_request');
    return Response.json(
      await createProposal(db, getNexconnApi(), user, {
        lobbyId: b.lobbyId,
        departAt: b.departAt,
        meetingPoint: b.meetingPoint,
        vehicle: b.vehicle,
        totalFare: b.totalFare,
        seats: b.seats,
      }),
    );
  } catch (e) {
    return toResponse(e);
  }
}
