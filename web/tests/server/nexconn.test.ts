import { afterEach, describe, expect, test, vi } from 'vitest';
import { signHeaders } from '@/server/nexconn/sign';
import { createNexconnApi, NexconnError } from '@/server/nexconn/api';

const cfg = (fetchImpl: typeof fetch) => ({
  appKey: 'key',
  appSecret: 'testsecret',
  hosts: ['api.sg-light-api.com', 'api-b.sg-light-api.com'] as [string, string],
  fetchImpl,
});

const ok = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));

afterEach(() => vi.useRealTimers());

describe('signing', () => {
  test('signHeaders matches known vector', async () => {
    const h = await signHeaders('key', 'testsecret', '14314', '1585127132438');
    expect(h).toEqual({
      'App-Key': 'key',
      Nonce: '14314',
      Timestamp: '1585127132438',
      Signature: '20b66b20b22a75d6bc47f7a7dd9d33fc16864057',
    });
  });
});

describe('NexconnApi', () => {
  test('issueToken posts to /v4/auth/access-token/issue and returns result.accessToken', async () => {
    const f = ok({ code: 0, result: { userId: 'u1', accessToken: 'T' } });
    const api = createNexconnApi(cfg(f as unknown as typeof fetch));
    expect(await api.issueToken('u1', 'Riya')).toBe('T');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.sg-light-api.com/v4/auth/access-token/issue');
    expect(JSON.parse(init.body as string)).toEqual({ userId: 'u1', name: 'Riya' });
    expect((init.headers as Record<string, string>)['App-Key']).toBe('key');
  });

  test('non-zero code throws NexconnError with code', async () => {
    const api = createNexconnApi(cfg(ok({ code: 1002 }) as unknown as typeof fetch));
    await expect(api.issueToken('u1', 'x')).rejects.toMatchObject({ name: 'NexconnError', code: 1002 });
    await expect(api.issueToken('u1', 'x')).rejects.toBeInstanceOf(NexconnError);
  });

  test('fails over to backup host when primary times out', async () => {
    vi.useFakeTimers();
    const f = vi.fn((url: string, init: RequestInit) => {
      if (url.includes('api.sg-light-api.com')) {
        return new Promise<Response>((_, reject) => {
          const abort = () => reject(new DOMException('aborted', 'AbortError'));
          if (init.signal!.aborted) abort();
          else init.signal!.addEventListener('abort', abort);
        });
      }
      return Promise.resolve(new Response(JSON.stringify({ code: 0, result: { userId: 'u1', accessToken: 'B' } })));
    });
    const api = createNexconnApi(cfg(f as unknown as typeof fetch));
    const p = api.issueToken('u1', 'x');
    await vi.advanceTimersByTimeAsync(5000);
    expect(await p).toBe('B');
    expect(f.mock.calls[1][0]).toContain('api-b.sg-light-api.com');
  });

  test('sendGroupMessage sends toChannelIds array, stringified content, isEchoToSender 1, hasMetadata, returns messageId', async () => {
    const f = ok({ code: 0, result: { messageIds: [{ channelId: 'lA', messageId: 'M1' }] } });
    const api = createNexconnApi(cfg(f as unknown as typeof fetch));
    const id = await api.sendGroupMessage({
      fromUserId: 'hopbot',
      channelId: 'lA',
      messageType: 'Hop:Proposal',
      content: { a: 1 },
      metadata: { status: 'open' },
      needReadReceipt: true,
    });
    expect(id).toBe('M1');
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({
      fromUserId: 'hopbot',
      toChannelIds: ['lA'],
      messageType: 'Hop:Proposal',
      content: '{"a":1}',
      isEchoToSender: 1,
      hasMetadata: true,
      metadata: { status: 'open' },
      needReadReceipt: 1,
    });
  });

  test('createGroup sends permissions.joinPerm 1 and maps duplicate-channel code to "exists"', async () => {
    const f = ok({ code: 0 });
    const api = createNexconnApi(cfg(f as unknown as typeof fetch));
    expect(await api.createGroup({ channelId: 'lA', name: 'Howrah', owner: 'hopbot', userIds: ['u1'] })).toBe('created');
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ channelId: 'lA', name: 'Howrah', owner: 'hopbot', userIds: ['u1'], permissions: { joinPerm: 1 } });

    const dup = createNexconnApi(cfg(ok({ code: 25409 }) as unknown as typeof fetch));
    expect(await dup.createGroup({ channelId: 'lA', name: 'x', owner: 'hopbot' })).toBe('exists');
  });

  test('setMessageMetadata uses channelType 3 and echoes to sender', async () => {
    const f = ok({ code: 0 });
    const api = createNexconnApi(cfg(f as unknown as typeof fetch));
    await api.setMessageMetadata({ messageId: 'M1', channelId: 'lA', userId: 'hopbot', metadata: { inCount: '2' } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v4/channel-type/message/metadata/set');
    expect(JSON.parse(init.body as string)).toEqual({
      messageId: 'M1', userId: 'hopbot', channelType: 3, channelId: 'lA', metadata: { inCount: '2' }, isEchoToSender: 1,
    });
  });
});

describe('fake', () => {
  test('failNext makes the next call of that method throw once; createGroup reports exists on repeat', async () => {
    const { createFakeNexconn } = await import('../fakes/nexconn');
    const nx = createFakeNexconn();
    expect(await nx.createGroup({ channelId: 'a', name: 'n', owner: 'o' })).toBe('created');
    expect(await nx.createGroup({ channelId: 'a', name: 'n', owner: 'o' })).toBe('exists');
    nx.failNext('joinGroup');
    await expect(nx.joinGroup('a', ['u'])).rejects.toThrow();
    await expect(nx.joinGroup('a', ['u'])).resolves.toBeUndefined();
    expect(nx.calls.filter((c) => c.method === 'joinGroup')).toHaveLength(2);
  });
});
