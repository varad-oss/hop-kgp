import { describe, expect, test } from 'vitest';
import { handlePreMessaging, verifyWebhook } from '@/server/webhook';

const LOBBY = 'l' + 'a'.repeat(32);
const POD = 'p' + 'a'.repeat(32);
const txt = (s: string) => JSON.stringify({ content: s });

describe('verifyWebhook', () => {
  test('accepts a correct signature and rejects a wrong one', async () => {
    const h = { Nonce: '14314', Timestamp: '1585127132438' };
    expect(await verifyWebhook({ ...h, Signature: '20b66b20b22a75d6bc47f7a7dd9d33fc16864057' }, 'testsecret')).toBe(true);
    expect(await verifyWebhook({ ...h, Signature: 'deadbeef' }, 'testsecret')).toBe(false);
    expect(await verifyWebhook({ ...h, Signature: '20B66B20B22A75D6BC47F7A7DD9D33FC16864057' }, 'testsecret')).toBe(true);
  });
});

describe('handlePreMessaging', () => {
  test('blocks a phone number in a lobby', () => {
    expect(handlePreMessaging({ channelId: LOBBY, messageType: 'RC:TxtMsg', content: txt('+91 98765 43210') })).toEqual({ pass: 0, extra: 'phone_blocked' });
  });
  test('allows phone numbers in a pod (members already share numbers)', () => {
    expect(handlePreMessaging({ channelId: POD, messageType: 'RC:TxtMsg', content: txt('+91 98765 43210') })).toEqual({ pass: 1 });
  });
  test('allows ordinary lobby chat', () => {
    expect(handlePreMessaging({ channelId: LOBBY, messageType: 'RC:TxtMsg', content: txt('leaving 6:30, 2 bags') })).toEqual({ pass: 1 });
  });
  test('ignores non-text messages and unparsable content', () => {
    expect(handlePreMessaging({ channelId: LOBBY, messageType: 'Hop:Proposal', content: '{"x":"9876543210"}' })).toEqual({ pass: 1 });
    expect(handlePreMessaging({ channelId: LOBBY, messageType: 'RC:TxtMsg', content: 'not json 9876543210' })).toEqual({ pass: 0, extra: 'phone_blocked' });
  });
});
