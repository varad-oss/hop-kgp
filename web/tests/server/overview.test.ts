import { describe, expect, test } from 'vitest';
import { departures, tripsOverview } from '@/server/overview';
import { lockWith, makeUser, makeWorld } from '../helpers/world';

const NOW = new Date('2026-11-20T06:00:00Z'); // 20 Nov IST; the world's lobby is 26 Nov

describe('tripsOverview', () => {
  test('a room with an open plan I am not in asks me to pick a plan', async () => {
    const w = await makeWorld(3);
    const [t] = await tripsOverview(w.db, w.users[1], NOW);
    expect(t).toMatchObject({ lobbyId: w.lobbyId, destination: 'HWH', direction: 'out', date: '2026-11-26', going: 3, openPlans: 1, stage: 'pick_plan', myPlan: null, trip: null, past: false });
  });

  test('alone in my plan → waiting; with a second person → lock_ready', async () => {
    const w = await makeWorld(3);
    await w.db.query('insert into hop.votes(proposal_id, user_id) values ($1,$2)', [w.proposalId, w.users[0].id]);
    let [t] = await tripsOverview(w.db, w.users[0], NOW);
    expect(t.stage).toBe('waiting');
    expect(t.myPlan).toMatchObject({ proposalId: w.proposalId, inCount: 1, seats: 4, meetingPoint: 'Main Building gate' });
    await w.db.query('insert into hop.votes(proposal_id, user_id) values ($1,$2)', [w.proposalId, w.users[1].id]);
    [t] = await tripsOverview(w.db, w.users[0], NOW);
    expect(t.stage).toBe('lock_ready');
  });

  test('a locked trip carries its ticket facts', async () => {
    const w = await makeWorld(4);
    const pod = await lockWith(w, [0, 1, 2]);
    await w.db.query(`update hop.pods set status = 'live' where id = $1`, [pod]);
    const [t] = await tripsOverview(w.db, w.users[1], NOW);
    expect(t.stage).toBe('locked');
    expect(t.trip).toMatchObject({ podId: pod, people: 3, each: 934, meetingPoint: 'Main Building gate', departAt: '2026-11-26T01:00:00Z' });
  });

  test('someone not in the locked trip still sees the room, not the trip', async () => {
    const w = await makeWorld(4);
    await lockWith(w, [0, 1]);
    const [t] = await tripsOverview(w.db, w.users[3], NOW);
    expect(t.trip).toBeNull();
    expect(t.stage).toBe('no_plans');
  });

  test('keeps the last 7 days as past, drops older', async () => {
    const w = await makeWorld(2);
    const later = new Date('2026-11-30T06:00:00Z');
    const [t] = await tripsOverview(w.db, w.users[0], later);
    expect(t.past).toBe(true);
    expect(await tripsOverview(w.db, w.users[0], new Date('2026-12-05T06:00:00Z'))).toHaveLength(0);
  });

  test('only my own rooms appear', async () => {
    const w = await makeWorld(2);
    const outsider = await makeUser(w.db, 'outsider');
    expect(await tripsOverview(w.db, outsider, NOW)).toHaveLength(0);
  });
});

describe('departures', () => {
  test('lists upcoming real rooms with counts and no names', async () => {
    const w = await makeWorld(3);
    const [d] = await departures(w.db, w.users[0], NOW);
    expect(d).toMatchObject({ lobbyId: w.lobbyId, destination: 'HWH', direction: 'out', date: '2026-11-26', going: 3, openPlans: 1, lockedPlans: 0, firstDepartAt: '2026-11-26T01:00:00Z', mine: true });
    expect(JSON.stringify(d)).not.toContain('user0');
  });

  test('marks rooms I have not posted in as not mine', async () => {
    const w = await makeWorld(2);
    const outsider = await makeUser(w.db, 'outsider');
    const [d] = await departures(w.db, outsider, NOW);
    expect(d.mine).toBe(false);
  });

  test('works without a viewer for the public board: nothing is mine', async () => {
    const w = await makeWorld(3);
    const [d] = await departures(w.db, null, NOW);
    expect(d).toMatchObject({ going: 3, mine: false });
  });

  test('excludes demo rooms and past days', async () => {
    const demo = await makeWorld(2, { isDemo: true });
    expect(await departures(demo.db, demo.users[0], NOW)).toHaveLength(0);
    const w = await makeWorld(2);
    expect(await departures(w.db, w.users[0], new Date('2026-11-27T06:00:00Z'))).toHaveLength(0);
  });
});
