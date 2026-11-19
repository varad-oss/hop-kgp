import { describe, expect, test } from 'vitest';
import { peek } from '@/server/peek';
import { lockWith, makeUser, makeWorld } from '../helpers/world';

async function openWith(w: Awaited<ReturnType<typeof makeWorld>>, voters: number[]) {
  for (const i of voters) await w.db.query('insert into hop.votes(proposal_id, user_id) values ($1,$2)', [w.proposalId, w.users[i].id]);
}

describe('peek', () => {
  test('line: "3 in · ₹934 each · 1 seat left · Howrah Station Thu 26 Nov, 6:30 AM"', async () => {
    const w = await makeWorld(4);
    await openWith(w, [0, 1, 2]);
    const p = await peek(w.db, w.proposalId);
    expect(p?.line).toBe('3 in · ₹934 each · 1 seat left · Howrah Station Thu 26 Nov, 6:30 AM');
    expect(p).toMatchObject({ lobbyId: w.lobbyId, destination: 'HWH', date: '2026-11-26', time: '6:30 AM' });
  });

  test('output contains no member names, halls or phones', async () => {
    const w = await makeWorld(4);
    await openWith(w, [0, 1, 2]);
    const json = JSON.stringify(await peek(w.db, w.proposalId));
    for (const secret of ['user0', 'user1', 'Azad', '9876543210', w.users[0].nexconn_id]) expect(json).not.toContain(secret);
  });

  test('a locked trip with a free seat says so; a full one says Full', async () => {
    const w = await makeWorld(4, { seats: 2 });
    await lockWith(w, [0, 1]);
    expect((await peek(w.db, w.proposalId))?.line).toBe('Full · ₹1,400 each · Howrah Station Thu 26 Nov, 6:30 AM');
  });

  test('demo, cancelled and unknown proposals → null', async () => {
    const d = await makeWorld(2, { isDemo: true });
    expect(await peek(d.db, d.proposalId)).toBeNull();
    const w = await makeWorld(2);
    await w.db.query(`update hop.proposals set status = 'cancelled'`);
    expect(await peek(w.db, w.proposalId)).toBeNull();
    expect(await peek(w.db, '00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await peek(w.db, 'not-a-uuid')).toBeNull();
    await makeUser(w.db, 'x');
  });
});
