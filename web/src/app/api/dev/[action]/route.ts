import { demoScope } from '@/server/auth';
import { getDb } from '@/server/db';
import { HttpError, toResponse } from '@/server/http';
import { getNexconnApi } from '@/server/nexconn/api';
import { requireUser } from '@/server/session';

const ROOM = 'devroom';
const BOT = () => process.env.HOPBOT_ID ?? 'hopbot';

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  try {
    if (process.env.DEV_ROOM_ENABLED !== '1') throw new HttpError(404, 'not_found');
    const { action } = await ctx.params;
    const user = await requireUser();
    if (!user.is_demo) throw new HttpError(403, 'demo_only');
    const nx = getNexconnApi();

    if (action === 'join') {
      await nx.issueToken(BOT(), 'Hop');
      await nx.createGroup({ channelId: ROOM, name: 'Dev room', owner: BOT() });
      await nx.joinGroup(ROOM, [user.nexconn_id]);
      return Response.json({ ok: true, me: user.nexconn_id, scope: demoScope(user) });
    }
    if (action === 'pair') {
      const group = new URL(req.url).searchParams.get('group');
      if (!group || !/^[0-9a-f-]{36}$/i.test(group)) throw new HttpError(400, 'bad_group');
      await getDb().query('update hop.users set demo_group = $2 where id = $1', [user.id, group]);
      return Response.json({ ok: true });
    }
    if (action === 'metadata') {
      const id = await nx.sendGroupMessage({
        fromUserId: BOT(),
        channelId: ROOM,
        messageType: 'Hop:Proposal',
        content: { proposalId: 'dev', note: 'metadata check' },
        metadata: { status: 'open', inCount: '1' },
      });
      await new Promise((r) => setTimeout(r, 2000));
      await nx.setMessageMetadata({ messageId: id, channelId: ROOM, userId: BOT(), metadata: { inCount: '2' } });
      return Response.json({ ok: true, messageId: id });
    }
    throw new HttpError(404, 'not_found');
  } catch (e) {
    return toResponse(e);
  }
}
