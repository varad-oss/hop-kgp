import { describe, expect, test } from 'vitest';
import { buildTicket, ensurePodMaterialized, getPod } from '@/server/pods';
import { lockWith, makeWorld } from '../helpers/world';

const calls = (nx: { calls: { method: string }[] }, m: string) => nx.calls.filter((c) => c.method === m);

describe('buildTicket', () => {
  test('splits the fare: ₹2,800 with 3 in → ₹934 each, ₹2 over, 1 free seat', async () => {
    const w = await makeWorld(4);
    const pod = await lockWith(w, [0, 1, 2]);
    const t = await buildTicket(w.db, pod);
    expect(t).toMatchObject({ each: 934, over: 2, seats: 4, freeSeats: 1, totalFare: 2800, destination: 'HWH', vehicle: 'sedan', isDemo: false });
    expect(t.members.map((m) => m.phone)).toEqual(['9876543210', '9876543210', '9876543210']);
  });

  test('a demo pod ticket shows "Demo number" instead of stored phones', async () => {
    const w = await makeWorld(3, { isDemo: true });
    const pod = await lockWith(w, [0, 1]);
    const t = await buildTicket(w.db, pod);
    expect(t.isDemo).toBe(true);
    expect(t.members.every((m) => m.phone === 'Demo number')).toBe(true);
  });

  test('carries the reason for a re-split', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    expect((await buildTicket(w.db, pod, { kind: 'left', name: 'Ankit' })).reason).toEqual({ kind: 'left', name: 'Ankit' });
  });
});

describe('ensurePodMaterialized', () => {
  test('twice → one createGroup, one Hop:Ticket send, status live', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    expect(await ensurePodMaterialized(w.db, w.nx, pod)).toEqual({ status: 'live' });
    expect(await ensurePodMaterialized(w.db, w.nx, pod)).toEqual({ status: 'live' });
    expect(calls(w.nx, 'createGroup')).toHaveLength(1);
    const tickets = calls(w.nx, 'sendGroupMessage').filter((c) => (c as any).args.messageType === 'Hop:Ticket');
    expect(tickets).toHaveLength(1);
    expect((tickets[0] as any).args).toMatchObject({ needReadReceipt: true });
    expect(calls(w.nx, 'joinGroup')).toHaveLength(1);
    expect(calls(w.nx, 'setMessageMetadata')).toHaveLength(1);
    expect((calls(w.nx, 'setMessageMetadata')[0] as any).args.metadata).toMatchObject({ status: 'locked', inCount: '2', podId: pod });
  });

  test('Nexconn fails mid-setup → pending with the lease cleared; the next call completes with one ticket', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    w.nx.failNext('createGroup');
    expect(await ensurePodMaterialized(w.db, w.nx, pod)).toEqual({ status: 'pending' });
    expect((await w.db.query<{ lease_until: string | null }>('select lease_until from hop.pods where id=$1', [pod]))[0].lease_until).toBeNull();
    expect(await ensurePodMaterialized(w.db, w.nx, pod)).toEqual({ status: 'live' });
    expect(calls(w.nx, 'sendGroupMessage')).toHaveLength(1);
  });

  test('a held lease → returns pending without calling Nexconn', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    await w.db.query(`update hop.pods set lease_until = now() + interval '1 minute' where id = $1`, [pod]);
    expect(await ensurePodMaterialized(w.db, w.nx, pod)).toEqual({ status: 'pending' });
    expect(w.nx.calls).toHaveLength(0);
  });
});

describe('getPod', () => {
  test('a non-member gets 404', async () => {
    const w = await makeWorld(4);
    const pod = await lockWith(w, [0, 1]);
    await expect(getPod(w.db, w.nx, w.users[3], pod, new Date('2026-11-25T10:00:00Z'))).rejects.toMatchObject({ status: 404 });
  });

  test('a member gets the live pod with ticket; pending pods are materialized on read', async () => {
    const w = await makeWorld(4);
    const pod = await lockWith(w, [0, 1]);
    const r = await getPod(w.db, w.nx, w.users[1], pod, new Date('2026-11-25T10:00:00Z'));
    expect(r.status).toBe('live');
    expect(r.channelId).toBe(`p${pod.replace(/-/g, '')}`);
    expect(r.ticket.members).toHaveLength(2);
  });

  test('more than 24 h after departure the pod reads as archived', async () => {
    const w = await makeWorld(3);
    const pod = await lockWith(w, [0, 1]);
    await ensurePodMaterialized(w.db, w.nx, pod);
    const r = await getPod(w.db, w.nx, w.users[0], pod, new Date('2026-11-27T02:00:00Z'));
    expect(r.status).toBe('archived');
  });
});
