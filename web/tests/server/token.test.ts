import { describe, expect, test } from 'vitest';
import { createTestDb } from '../db/harness';
import { createFakeNexconn } from '../fakes/nexconn';
import { ensureUser } from '@/server/auth';
import { hitRateLimit } from '@/server/rateLimit';
import { handleToken } from '@/server/token';

const UUID = '3f2a9c1e-7b4d-4e8a-9a10-0c5d6e7f8a9b';

describe('hitRateLimit', () => {
  test('allows up to the limit then blocks', async () => {
    const db = await createTestDb();
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit(db, 'k', 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });
  test('keys are independent and the window resets', async () => {
    const db = await createTestDb();
    expect(await hitRateLimit(db, 'a', 1, 60)).toBe(true);
    expect(await hitRateLimit(db, 'b', 1, 60)).toBe(true);
    expect(await hitRateLimit(db, 'a', 1, 60)).toBe(false);
    await db.query(`update hop.rate_limits set window_start = now() - interval '2 minutes' where key = 'a'`);
    expect(await hitRateLimit(db, 'a', 1, 60)).toBe(true);
  });
});

describe('handleToken', () => {
  test('issues a token for the session user with their display name', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const user = await ensureUser(db, { authId: UUID, email: 'r@kgpian.iitkgp.ac.in', name: 'Riya', isDemo: false });
    const out = await handleToken({ db, nx, user });
    expect(out).toEqual({ token: `token-${user.nexconn_id}`, userId: user.nexconn_id });
    expect(nx.calls[0]).toEqual({ method: 'issueToken', args: { userId: user.nexconn_id, name: 'Riya' } });
  });

  test('11th call within a minute is rejected with 429', async () => {
    const db = await createTestDb();
    const nx = createFakeNexconn();
    const user = await ensureUser(db, { authId: UUID, email: 'r@kgpian.iitkgp.ac.in', name: 'Riya', isDemo: false });
    for (let i = 0; i < 10; i++) await handleToken({ db, nx, user });
    await expect(handleToken({ db, nx, user })).rejects.toMatchObject({ status: 429, error: 'slow_down' });
  });
});
