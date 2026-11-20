import { containsPhone } from '@/domain/phone';
import { sha1Hex } from './nexconn/sign';

const MAX_SKEW_MS = 5 * 60_000;

export async function verifyWebhook(
  h: { Nonce: string; Timestamp: string; Signature: string },
  appSecret: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!appSecret) return false;
  const ts = Number(h.Timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > MAX_SKEW_MS) return false;
  const expected = await sha1Hex(appSecret + h.Nonce + h.Timestamp);
  const given = h.Signature.toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
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
