import { describe, expect, test } from 'vitest';
import { captainPrompt, fallbackSummary, runCaptain, streamCaptain } from '@/server/captain';
import { buildTicket } from '@/server/pods';
import { createFakeNexconn } from '../fakes/nexconn';
import { lockWith, makeUser, makeWorld } from '../helpers/world';

async function* gen(parts: string[]) {
  for (const p of parts) yield p;
}
const streamCalls = (nx: { calls: { method: string; args: unknown }[] }) =>
  nx.calls.filter((c) => c.method === 'sendGroupStreamChunk').map((c) => c.args as { seq: number; complete: boolean; messageId?: string; content: string });

describe('streamCaptain', () => {
  test('3 chunks → seq 1..3, messageId from chunk 2 on, complete only on the last', async () => {
    const nx = createFakeNexconn();
    const text = await streamCaptain(nx, { fromUserId: 'hopbot', channelId: 'pod1' }, gen(['Plan: ', '6:30 AM ', 'at the gate.']));
    const c = streamCalls(nx);
    expect(c.map((x) => x.seq)).toEqual([1, 2, 3]);
    expect(c[0].messageId).toBeUndefined();
    expect(c[1].messageId).toBeDefined();
    expect(c[2].messageId).toBe(c[1].messageId);
    expect(c.map((x) => x.complete)).toEqual([false, false, true]);
    expect(text).toBe('Plan: 6:30 AM at the gate.');
  });

  test('onStart gets the message id once, after the first chunk', async () => {
    const nx = createFakeNexconn();
    const ids: string[] = [];
    await streamCaptain(nx, { fromUserId: 'hopbot', channelId: 'pod1' }, gen(['a', 'b', 'c']), (id) => ids.push(id));
    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe(streamCalls(nx)[1].messageId);
  });

  test('a single chunk is sent complete', async () => {
    const nx = createFakeNexconn();
    await streamCaptain(nx, { fromUserId: 'hopbot', channelId: 'pod1' }, gen(['Only one.']));
    expect(streamCalls(nx).map((x) => [x.seq, x.complete])).toEqual([[1, true]]);
  });

  test('empty chunks are skipped and an empty stream sends nothing', async () => {
    const nx = createFakeNexconn();
    expect(await streamCaptain(nx, { fromUserId: 'hopbot', channelId: 'pod1' }, gen(['', '']))).toBe('');
    expect(streamCalls(nx)).toHaveLength(0);
  });
});

describe('captainPrompt', () => {
  test('carries the facts, member names, recent chat, and the 60-word instruction', async () => {
    const w = await makeWorld(4);
    const t = await buildTicket(w.db, await lockWith(w, [0, 1, 2]));
    const p = captainPrompt(t, [{ name: 'user1', text: 'Who books the cab?' }]);
    expect(p).toContain('Howrah');
    expect(p).toContain('user0');
    expect(p).toContain('Who books the cab?');
    expect(p).toContain('1 seat open');
    expect(p).toMatch(/60 words/);
    expect(p).not.toContain('9876543210');
  });
});

describe('fallbackSummary', () => {
  test('states plan, people, fare and seats without an LLM', async () => {
    const w = await makeWorld(4);
    const t = await buildTicket(w.db, await lockWith(w, [0, 1, 2]));
    const s = fallbackSummary(t);
    expect(s).toContain('Main Building gate');
    expect(s).toContain('user0, user1 and user2');
    expect(s).toContain('₹934');
    expect(s).toContain('1 seat');
  });
});

describe('runCaptain', () => {
  test('a member gets a streamed summary from the Hop bot into the pod channel', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    const r = await runCaptain(w.db, w.nx, w.users[0], pod, [], () => gen(['All ', 'set.']));
    expect(r.result).toBe('ok');
    expect(r.messageId).toBeTruthy();
    await r.done;
    const c = w.nx.calls.filter((x) => x.method === 'sendGroupStreamChunk').map((x) => x.args as { fromUserId: string; channelId: string });
    expect(c).toHaveLength(2);
    expect(c[0].fromUserId).toBe('hopbot');
  });

  test('a non-member is refused with 404', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    const outsider = await makeUser(w.db, 'outsider');
    await expect(runCaptain(w.db, w.nx, outsider, pod, [], () => gen(['x']))).rejects.toMatchObject({ status: 404 });
  });

  test('the model failing before any text falls back to the plain summary', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    // eslint-disable-next-line require-yield
    const r = await runCaptain(w.db, w.nx, w.users[0], pod, [], async function* () {
      throw new Error('no key');
    });
    expect(r.result).toBe('ok');
    await r.done;
    const text = streamCalls(w.nx).map((x) => x.content).join('');
    expect(text).toContain('Main Building gate');
  });

  test('limited to 3 summaries per pod per hour', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    for (let i = 0; i < 3; i++) await (await runCaptain(w.db, w.nx, w.users[i % 2], pod, [], () => gen(['ok']))).done;
    await expect(runCaptain(w.db, w.nx, w.users[0], pod, [], () => gen(['ok']))).rejects.toMatchObject({ status: 429 });
  });
});
