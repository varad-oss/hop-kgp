import { handlePreMessaging, verifyWebhook } from '@/server/webhook';

export async function POST(req: Request) {
  const sig = {
    Nonce: req.headers.get('nonce') ?? '',
    Timestamp: req.headers.get('timestamp') ?? '',
    Signature: req.headers.get('signature') ?? '',
  };
  if (!sig.Signature || !(await verifyWebhook(sig, process.env.NEXCONN_APP_SECRET ?? ''))) {
    return new Response('unauthorized', { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { type?: string; data?: { channelId: string; messageType: string; content: string }[] } | null;
  if (body?.type === 'group_channel:pre_messaging' && body.data?.[0]) {
    return Response.json(handlePreMessaging(body.data[0]));
  }
  return Response.json({ pass: 1 });
}
