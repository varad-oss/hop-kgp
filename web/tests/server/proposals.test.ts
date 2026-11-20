import { describe, expect, test } from 'vitest';
import { createProposal, joinProposal, leaveProposal, lockProposal } from '@/server/proposals';
import { DEPART, makeUser, makeWorld, type World } from '../helpers/world';

const NOW = new Date('2026-11-25T10:00:00Z');
const input = (w: World) => ({ lobbyId: w.lobbyId, departAt: DEPART, meetingPoint: 'Main Building gate', vehicle: 'sedan' as const, totalFare: 2800, seats: 4 });
const calls = (w: World, m: string) => w.nx.calls.filter((c) => c.method === m) as { method: string; args: any }[];

async function worldWithProposal(n = 4) {
  const w = await makeWorld(n);
  await w.db.query('delete from hop.proposals where id = $1', [w.proposalId]); // start with no proposals; helper's is unused
  const { proposalId } = await createProposal(w.db, w.nx, w.users[0], input(w), NOW);
  return { w, proposalId };
}

describe('createProposal', () => {
  test('sends Hop:Proposal with live metadata and counts the creator in', async () => {
    const { w, proposalId } = await worldWithProposal();
    const send = calls(w, 'sendGroupMessage').find((c) => c.args.messageType === 'Hop:Proposal')!;
    expect(send.args.channelId).toBe(w.lobbyChannel);
    expect(send.args.fromUserId).toBe(w.users[0].nexconn_id);
    expect(send.args.content).toMatchObject({ proposalId, meetingPoint: 'Main Building gate', vehicle: 'sedan', totalFare: 2800, seats: 4, creatorName: 'user0' });
    expect(send.args.metadata).toEqual({ status: 'open', inCount: '1', bags: '1', voters: w.users[0].nexconn_id });
  });

  test('without a hall and phone → 428 profile_required', async () => {
    const w = await makeWorld(2);
    const u = await makeUser(w.db, 'nophone', { phone: null, hall: null });
    await w.db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [u.id, w.lobbyId]);
    await expect(createProposal(w.db, w.nx, u, input(w), NOW)).rejects.toMatchObject({ status: 428, error: 'profile_required' });
  });

  test.each([
    ['seats above the vehicle', { seats: 5 }, 'bad_request'],
    ['a past departure', { departAt: '2026-11-24T01:00:00Z' }, 'bad_time'],
    ['a different day than the lobby', { departAt: '2026-11-27T01:00:00Z' }, 'bad_time'],
    ['an empty meeting point', { meetingPoint: '  ' }, 'bad_request'],
    ['a zero fare', { totalFare: 0 }, 'bad_request'],
  ])('rejects %s with 400', async (_n, patch, error) => {
    const w = await makeWorld(2);
    await expect(createProposal(w.db, w.nx, w.users[0], { ...input(w), ...patch }, NOW)).rejects.toMatchObject({ status: 400, error });
  });
});

describe('createProposal sanitizes the meeting point', () => {
  test('strips control characters before storing', async () => {
    const w = await makeWorld(2);
    const { proposalId } = await createProposal(w.db, w.nx, w.users[0], { ...input(w), meetingPoint: 'Gate\r\n 1\u0000' }, NOW);
    expect((await w.db.query<{ meeting_point: string }>('select meeting_point from hop.proposals where id = $1', [proposalId]))[0].meeting_point).toBe('Gate 1');
  });
});

describe('joinProposal', () => {
  test('a second user joining mirrors inCount 2 and both voters onto the card', async () => {
    const { w, proposalId } = await worldWithProposal();
    expect(await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW)).toMatchObject({ result: 'joined', inCount: 2 });
    const m = calls(w, 'setMessageMetadata').at(-1)!;
    expect(m.args.metadata).toMatchObject({ status: 'open', inCount: '2', voters: `${w.users[0].nexconn_id},${w.users[1].nexconn_id}` });
  });

  test('when full → 409 full and no metadata call', async () => {
    const w = await makeWorld(3);
    const { proposalId } = await createProposal(w.db, w.nx, w.users[0], { ...input(w), seats: 2 }, NOW);
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    const before = calls(w, 'setMessageMetadata').length;
    await expect(joinProposal(w.db, w.nx, w.users[2], proposalId, NOW)).rejects.toMatchObject({ status: 409, error: 'full' });
    expect(calls(w, 'setMessageMetadata')).toHaveLength(before);
  });

  test('moving a vote mirrors both proposals', async () => {
    const { w, proposalId: p1 } = await worldWithProposal();
    const { proposalId: p2 } = await createProposal(w.db, w.nx, w.users[1], { ...input(w), meetingPoint: 'Tech Market gate' }, NOW);
    await joinProposal(w.db, w.nx, w.users[2], p1, NOW);
    const before = calls(w, 'setMessageMetadata').length;
    await joinProposal(w.db, w.nx, w.users[2], p2, NOW);
    const mirrored = calls(w, 'setMessageMetadata').slice(before).map((c) => c.args.metadata.inCount);
    expect(mirrored.sort()).toEqual(['1', '2']); // old proposal drops to 1, new one rises to 2
  });

  test('without hall and phone → 428 profile_required', async () => {
    const { w, proposalId } = await worldWithProposal();
    const u = await makeUser(w.db, 'nophone', { phone: null });
    await w.db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [u.id, w.lobbyId]);
    await expect(joinProposal(w.db, w.nx, u, proposalId, NOW)).rejects.toMatchObject({ status: 428 });
  });

  test('a demo user acting on a real proposal → 404', async () => {
    const { w, proposalId } = await worldWithProposal();
    const demo = await makeUser(w.db, 'guest', { isDemo: true });
    await expect(joinProposal(w.db, w.nx, demo, proposalId, NOW)).rejects.toMatchObject({ status: 404 });
  });
});

describe('lockProposal', () => {
  test('lock sets up the pod; locking twice returns the same pod and one ticket', async () => {
    const { w, proposalId } = await worldWithProposal();
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    const a = await lockProposal(w.db, w.nx, w.users[0], proposalId);
    const b = await lockProposal(w.db, w.nx, w.users[1], proposalId);
    expect(a.result).toBe('locked');
    expect(b).toMatchObject({ result: 'already_locked', podId: a.podId });
    expect(calls(w, 'sendGroupMessage').filter((c) => c.args.messageType === 'Hop:Ticket')).toHaveLength(1);
    expect(calls(w, 'setMessageMetadata').at(-1)!.args.metadata).toMatchObject({ status: 'locked', podId: a.podId });
  });

  test('too few votes → 409 too_few', async () => {
    const { w, proposalId } = await worldWithProposal();
    await expect(lockProposal(w.db, w.nx, w.users[0], proposalId)).rejects.toMatchObject({ status: 409, error: 'too_few' });
  });

  test('a lobby member who has not voted → 403 not_voter', async () => {
    const { w, proposalId } = await worldWithProposal();
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    await expect(lockProposal(w.db, w.nx, w.users[3], proposalId)).rejects.toMatchObject({ status: 403, error: 'not_voter' });
  });
});

describe('after lock', () => {
  async function locked() {
    const { w, proposalId } = await worldWithProposal();
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    const { podId } = await lockProposal(w.db, w.nx, w.users[0], proposalId);
    return { w, proposalId, podId: podId! };
  }

  test('joining a free seat adds the member to the pod channel and re-splits the ticket', async () => {
    const { w, proposalId, podId } = await locked();
    const r = await joinProposal(w.db, w.nx, w.users[2], proposalId, NOW);
    expect(r).toMatchObject({ result: 'joined', inCount: 3, podId });
    expect(calls(w, 'joinGroup').at(-1)!.args).toEqual({ channelId: `p${podId.replace(/-/g, '')}`, userIds: [w.users[2].nexconn_id] });
    const ticket = calls(w, 'sendGroupMessage').filter((c) => c.args.messageType === 'Hop:Ticket').at(-1)!.args.content;
    expect(ticket).toMatchObject({ each: 934, over: 2, reason: { kind: 'joined', name: 'user2' } });
  });

  test('leaving removes the member from the pod channel and posts a re-split ticket', async () => {
    const { w, proposalId, podId } = await locked();
    await joinProposal(w.db, w.nx, w.users[2], proposalId, NOW);
    const r = await leaveProposal(w.db, w.nx, w.users[2], proposalId, NOW);
    expect(r).toMatchObject({ result: 'left', inCount: 2, podId });
    expect(calls(w, 'leaveGroup').at(-1)!.args).toEqual({ channelId: `p${podId.replace(/-/g, '')}`, userIds: [w.users[2].nexconn_id] });
    const ticket = calls(w, 'sendGroupMessage').filter((c) => c.args.messageType === 'Hop:Ticket').at(-1)!.args.content;
    expect(ticket).toMatchObject({ each: 1400, reason: { kind: 'left', name: 'user2' } });
  });

  test('leaving an open proposal mirrors the lower count', async () => {
    const { w, proposalId } = await worldWithProposal();
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    await leaveProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    expect(calls(w, 'setMessageMetadata').at(-1)!.args.metadata).toMatchObject({ inCount: '1', voters: w.users[0].nexconn_id });
  });
});

describe('self-healing against Nexconn blips', () => {
  test('if the proposal card cannot be sent, the plan is rolled back rather than left invisible', async () => {
    const w = await makeWorld(2);
    w.nx.failNext('sendGroupMessage');
    await expect(createProposal(w.db, w.nx, w.users[0], input(w), NOW)).rejects.toBeTruthy();
    expect(await w.db.query('select 1 from hop.proposals where message_id is null')).toHaveLength(0);
    expect(await w.db.query('select 1 from hop.votes')).toHaveLength(0);
  });

  test('retrying a join that already counted re-adds the user to the live pod channel', async () => {
    const { w, proposalId } = await (async () => {
      const w = await makeWorld(4);
      await w.db.query('delete from hop.proposals where id = $1', [w.proposalId]);
      const { proposalId } = await createProposal(w.db, w.nx, w.users[0], input(w), NOW);
      return { w, proposalId };
    })();
    await joinProposal(w.db, w.nx, w.users[1], proposalId, NOW);
    await lockProposal(w.db, w.nx, w.users[0], proposalId, NOW);
    w.nx.failNext('joinGroup');
    await expect(joinProposal(w.db, w.nx, w.users[2], proposalId, NOW)).rejects.toBeTruthy(); // DB joined, Nexconn blipped
    const before = calls(w, 'joinGroup').length;
    expect((await joinProposal(w.db, w.nx, w.users[2], proposalId, NOW)).result).toBe('already');
    expect(calls(w, 'joinGroup').length).toBe(before + 1);
  });
});
