import { after } from 'next/server';
import { geminiGenerator, runCaptain, type ChatLine } from '@/server/captain';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { hitRateLimit } from '@/server/rateLimit';
import { requireUser } from '@/server/session';

export const maxDuration = 30;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!(await hitRateLimit(getDb(), `captain-user:${user.id}`, 10, 3600))) throw new HttpError(429, 'slow_down');
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { recent?: unknown };
    const recent: ChatLine[] = Array.isArray(body.recent)
      ? body.recent
          .filter((l): l is ChatLine => !!l && typeof l === 'object' && typeof (l as ChatLine).name === 'string' && typeof (l as ChatLine).text === 'string')
          .slice(-30)
          .map((l) => ({ name: l.name.slice(0, 40), text: l.text.slice(0, 300) }))
      : [];
    const r = await runCaptain(getDb(), getNexconnApi(), user, id, recent, geminiGenerator(process.env.GEMINI_API_KEY));
    after(() => r.done);
    return Response.json({ result: r.result, messageId: r.messageId });
  } catch (e) {
    return toResponse(e);
  }
}
