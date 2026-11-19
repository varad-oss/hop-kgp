import { containsPhone } from '@/domain/phone';
import { sha1Hex } from './nexconn/sign';

export async function verifyWebhook(h: { Nonce: string; Timestamp: string; Signature: string }, appSecret: string): Promise<boolean> {
  const expected = await sha1Hex(appSecret + h.Nonce + h.Timestamp);
  return expected === h.Signature.toLowerCase();
}

const LOBBY_CHANNEL = /^l[0-9a-f]{32}$/;

/** Runs inside Nexconn's 5 s budget: no DB, no network. Regex only. */
export function handlePreMessaging(d: { channelId: string; messageType: string; content: string }): { pass: 0 | 1; extra?: string } {
  if (d.messageType !== 'RC:TxtMsg' || !LOBBY_CHANNEL.test(d.channelId)) return { pass: 1 };
  let text = d.content;
  try {
    const parsed = JSON.parse(d.content) as { content?: unknown; text?: unknown };
    text = String(parsed.content ?? parsed.text ?? '');
  } catch {
    /* treat the raw string as the text */
  }
  return containsPhone(text) ? { pass: 0, extra: 'phone_blocked' } : { pass: 1 };
}
