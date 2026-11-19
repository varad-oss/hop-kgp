import { describe, expect, test } from 'vitest';
import { computeStats } from '@/server/stats';
import { lockWith, makeUser, makeWorld } from '../helpers/world';

describe('computeStats', () => {
  test('excludes demo users, lobbies and pods', async () => {
    const real = await makeWorld(3);
    await lockWith(real, [0, 1]);
    const demo = await makeWorld(3, { isDemo: true });
    await lockWith(demo, [0, 1]);
    // put the demo world into the real world's database to prove the filters
    const w = real;
    const demoUser = await makeUser(w.db, 'guest', { isDemo: true });
    const lobby = (await w.db.query<{ id: string }>(`insert into hop.lobbies(destination, direction, travel_date, channel_id, is_demo, demo_owner) values ('CCU','out','2026-11-26','dl1',true,$1) returning id`, [demoUser.id]))[0].id;
    await w.db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [demoUser.id, lobby]);
    const s = await computeStats(w.db);
    expect(s).toMatchObject({ students: 3, tripsLocked: 1, lobbies: 1 });
  });

  test('rupeesSaved: one real pod ₹2,800 with 3 in → 5600', async () => {
    const w = await makeWorld(4);
    await lockWith(w, [0, 1, 2]);
    await w.db.query(`update hop.pods set status = 'live'`);
    expect((await computeStats(w.db)).rupeesSaved).toBe(5600);
  });

  test('returnTripsPosted counts real intents in back lobbies', async () => {
    const w = await makeWorld(2);
    const back = (await w.db.query<{ id: string }>(`insert into hop.lobbies(destination, direction, travel_date, channel_id) values ('KGP','back','2027-01-02','b1') returning id`))[0].id;
    await w.db.query(`insert into hop.intents(user_id, lobby_id, window_key, bags) values ($1,$2,'w1',1)`, [w.users[0].id, back]);
    expect((await computeStats(w.db)).returnTripsPosted).toBe(1);
  });

  test('median link→intent time is null under 5 samples, then the median of real users', async () => {
    const w = await makeWorld(2);
    const ev = (ms: number, uid: string) => w.db.query(`insert into hop.events(user_id, name, ms) values ($1,'intent_sent',$2)`, [uid, ms]);
    for (const ms of [10000, 20000, 30000, 40000]) await ev(ms, w.users[0].id);
    expect((await computeStats(w.db)).medianLinkToIntentMs).toBeNull();
    await ev(50000, w.users[1].id);
    expect((await computeStats(w.db)).medianLinkToIntentMs).toBe(30000);
    const demo = await makeUser(w.db, 'guest', { isDemo: true });
    await ev(1, demo.id);
    expect((await computeStats(w.db)).medianLinkToIntentMs).toBe(30000);
  });

  test('daily series has signups and locks per IST day', async () => {
    const w = await makeWorld(3);
    await lockWith(w, [0, 1]);
    const s = await computeStats(w.db);
    expect(s.daily).toHaveLength(1);
    expect(s.daily[0]).toMatchObject({ signups: 3, locks: 1 });
    expect(s.daily[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
