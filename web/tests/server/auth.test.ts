import { describe, expect, test, vi } from 'vitest';
import { createTestDb } from '../db/harness';
import { HttpError, toResponse } from '@/server/http';
import { lobbyChannelId, nexconnUserId, podChannelId } from '@/server/ids';
import { assertAllowedUser, demoScope, ensureUser, handleCallback, isKgpianEmail, safeNext, updateProfile } from '@/server/auth';

const UUID = '3f2a9c1e-7b4d-4e8a-9a10-0c5d6e7f8a9b';

describe('ids', () => {
  test('nexconn ids are alphanumeric and prefixed', () => {
    expect(nexconnUserId(UUID, false)).toMatch(/^u[0-9a-f]{32}$/);
    expect(nexconnUserId(UUID, true)).toMatch(/^demo[0-9a-f]{32}$/);
    expect(lobbyChannelId(UUID)).toMatch(/^l[0-9a-f]{32}$/);
    expect(podChannelId(UUID)).toMatch(/^p[0-9a-f]{32}$/);
  });
});

describe('isKgpianEmail', () => {
  test.each(['a.b@kgpian.iitkgp.ac.in', 'A@KGPIAN.IITKGP.AC.IN'])('accepts %s', (e) => expect(isKgpianEmail(e)).toBe(true));
  test.each(['x@gmail.com', 'x@iitkgp.ac.in', 'x@kgpian.iitkgp.ac.in.evil.com', undefined, ''])('rejects %s', (e) =>
    expect(isKgpianEmail(e as string | undefined)).toBe(false),
  );
});

describe('safeNext', () => {
  test('only same-origin paths', () => {
    expect(safeNext('/l/abc?x=1')).toBe('/l/abc?x=1');
    expect(safeNext('//evil.com')).toBe('/home');
    expect(safeNext('https://evil.com')).toBe('/home');
    expect(safeNext('/\\evil.com')).toBe('/home');
    expect(safeNext(null)).toBe('/home');
  });
  test('rejects control characters that browsers strip into a protocol-relative URL', () => {
    for (const bad of ['/\t/evil.com', '/\n/evil.com', '/\r/evil.com', '/ /evil.com', '/\u0000/x']) expect(safeNext(bad)).toBe('/home');
    expect(safeNext('/new?d=HWH&date=2026-11-26&then=join:abc')).toBe('/new?d=HWH&date=2026-11-26&then=join:abc');
  });
  test('assertAllowedUser: only kgpian accounts or anonymous demo sessions', () => {
    expect(() => assertAllowedUser({ email: 'a@kgpian.iitkgp.ac.in', isAnonymous: false })).not.toThrow();
    expect(() => assertAllowedUser({ email: undefined, isAnonymous: true })).not.toThrow();
    expect(() => assertAllowedUser({ email: 'x@gmail.com', isAnonymous: false })).toThrowError(expect.objectContaining({ status: 403, error: 'not_kgpian' }));
    expect(() => assertAllowedUser({ email: undefined, isAnonymous: false })).toThrowError(expect.objectContaining({ status: 403 }));
  });
});

describe('http', () => {
  test('toResponse maps HttpError and hides unknown errors', async () => {
    const r = toResponse(new HttpError(409, 'full'));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: 'full' });
    const r2 = toResponse(new Error('secret db detail'));
    expect(r2.status).toBe(500);
    expect(JSON.stringify(await r2.json())).not.toContain('secret');
  });
});

describe('users', () => {
  test('ensureUser is idempotent per authId and derives the nexconn id', async () => {
    const db = await createTestDb();
    const a = { authId: UUID, email: 'a@kgpian.iitkgp.ac.in', name: 'Riya', isDemo: false };
    const u1 = await ensureUser(db, a);
    const u2 = await ensureUser(db, a);
    expect(u2.id).toBe(u1.id);
    expect(u1.nexconn_id).toBe(`u${u1.id.replace(/-/g, '')}`);
    expect((await db.query('select 1 from hop.users')).length).toBe(1);
  });

  test('demo users get the demo prefix and flag', async () => {
    const db = await createTestDb();
    const u = await ensureUser(db, { authId: UUID, email: null, name: 'Demo guest', isDemo: true });
    expect(u.is_demo).toBe(true);
    expect(u.nexconn_id.startsWith('demo')).toBe(true);
    expect(demoScope(u)).toBe(u.id);
    expect(demoScope({ ...u, demo_group: UUID })).toBe(UUID);
  });

  test('updateProfile stores normalized phone and rejects invalid', async () => {
    const db = await createTestDb();
    const u = await ensureUser(db, { authId: UUID, email: 'a@kgpian.iitkgp.ac.in', name: 'Riya', isDemo: false });
    const upd = await updateProfile(db, u.id, { hall: ' Azad ', phone: '+91 98765-43210' });
    expect(upd.phone).toBe('9876543210');
    expect(upd.hall).toBe('Azad');
    await expect(updateProfile(db, u.id, { hall: 'Azad', phone: '12345' })).rejects.toMatchObject({ status: 400, error: 'bad_phone' });
    await expect(updateProfile(db, u.id, { hall: '', phone: '9876543210' })).rejects.toMatchObject({ status: 400, error: 'bad_hall' });
  });

  test('updateProfile keeps the saved phone when none is sent, but needs one the first time', async () => {
    const db = await createTestDb();
    const u = await ensureUser(db, { authId: UUID, email: 'a@kgpian.iitkgp.ac.in', name: 'Riya', isDemo: false });
    await expect(updateProfile(db, u.id, { hall: 'Azad' })).rejects.toMatchObject({ status: 400, error: 'bad_phone' });
    await updateProfile(db, u.id, { hall: 'Azad', phone: '9876543210' });
    const upd = await updateProfile(db, u.id, { hall: 'Nehru' });
    expect(upd).toMatchObject({ hall: 'Nehru', phone: '9876543210' });
  });
});

describe('handleCallback', () => {
  const sess = (email: string | undefined, anon = false) => ({ id: UUID, email, name: 'Riya', isAnonymous: anon });

  test('non-kgpian Google account is signed out and sent to /signin?notkgp=1', async () => {
    const db = await createTestDb();
    const signOut = vi.fn(async () => {});
    const out = await handleCallback({ db, code: 'c', next: '/l/abc', exchange: async () => sess('x@gmail.com'), signOut });
    expect(out).toBe('/signin?notkgp=1');
    expect(signOut).toHaveBeenCalledOnce();
    expect(await db.query('select 1 from hop.users')).toHaveLength(0);
  });

  test('kgpian account is created and redirected to next', async () => {
    const db = await createTestDb();
    const signOut = vi.fn(async () => {});
    const out = await handleCallback({ db, code: 'c', next: '/l/abc', exchange: async () => sess('r@kgpian.iitkgp.ac.in'), signOut });
    expect(out).toBe('/l/abc');
    expect(signOut).not.toHaveBeenCalled();
    expect(await db.query('select 1 from hop.users')).toHaveLength(1);
  });

  test('missing code or failed exchange goes to /signin?error=auth', async () => {
    const db = await createTestDb();
    const signOut = vi.fn(async () => {});
    expect(await handleCallback({ db, code: null, next: null, exchange: async () => sess('r@kgpian.iitkgp.ac.in'), signOut })).toBe('/signin?error=auth');
    expect(await handleCallback({ db, code: 'c', next: null, exchange: async () => { throw new Error('bad'); }, signOut })).toBe('/signin?error=auth');
  });
});
