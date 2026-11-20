import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError } from './http';
import { nexconnUserId } from './ids';
import { normalizeIndianMobile } from '@/domain/phone';

export type UserRow = {
  id: string;
  auth_id: string;
  email: string | null;
  name: string;
  hall: string | null;
  phone: string | null;
  is_demo: boolean;
  demo_group: string | null;
  nexconn_id: string;
};

const KGPIAN = '@kgpian.iitkgp.ac.in';

export function isKgpianEmail(email: string | undefined | null): boolean {
  return !!email && email.toLowerCase().endsWith(KGPIAN) && email.length > KGPIAN.length;
}

export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/home';
  // Browsers strip tabs, newlines and spaces inside URLs, turning "/\t/evil.com" into "//evil.com".
  if (/[\u0000-\u0020\u007f\\]/.test(next)) return '/home';
  try {
    const u = new URL(next, 'https://hop.invalid');
    if (u.origin !== 'https://hop.invalid') return '/home';
    return u.pathname + u.search + u.hash;
  } catch {
    return '/home';
  }
}

/** Server-side gate: only @kgpian Google accounts or anonymous demo sessions may use the API. */
export function assertAllowedUser(u: { email: string | undefined | null; isAnonymous: boolean }): void {
  if (u.isAnonymous) return;
  if (!isKgpianEmail(u.email)) throw new HttpError(403, 'not_kgpian');
}

export const demoScope = (u: Pick<UserRow, 'id' | 'demo_group'>): string => u.demo_group ?? u.id;

export async function ensureUser(
  db: Db,
  a: { authId: string; email: string | null; name: string; isDemo: boolean },
): Promise<UserRow> {
  const id = randomUUID();
  await db.query(
    `insert into hop.users(id, auth_id, email, name, is_demo, nexconn_id) values ($1,$2,$3,$4,$5,$6)
     on conflict (auth_id) do nothing`,
    [id, a.authId, a.email, a.name.slice(0, 64), a.isDemo, nexconnUserId(id, a.isDemo)],
  );
  const rows = await db.query<UserRow>('select * from hop.users where auth_id = $1', [a.authId]);
  return rows[0];
}

/** Saves hall and phone. Without a phone, the saved one is kept; a first save must include one. */
export async function updateProfile(db: Db, userId: string, p: { hall: string; phone?: string }): Promise<UserRow> {
  const hall = p.hall.trim();
  if (hall.length < 1 || hall.length > 40) throw new HttpError(400, 'bad_hall');
  const phone = p.phone === undefined ? undefined : normalizeIndianMobile(p.phone);
  if (phone === null) throw new HttpError(400, 'bad_phone');
  const rows = await db.query<UserRow>(
    'update hop.users set hall = $2, phone = coalesce($3, phone) where id = $1 and coalesce($3, phone) is not null returning *',
    [userId, hall, phone ?? null],
  );
  if (!rows[0] && phone === undefined) throw new HttpError(400, 'bad_phone');
  if (!rows[0]) throw new HttpError(404, 'not_found');
  return rows[0];
}

export type SessionUser = { id: string; email: string | undefined; name: string; isAnonymous: boolean };

export async function handleCallback(d: {
  db: Db;
  code: string | null;
  next: string | null;
  exchange: (code: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
}): Promise<string> {
  if (!d.code) return '/signin?error=auth';
  let s: SessionUser;
  try {
    s = await d.exchange(d.code);
  } catch {
    return '/signin?error=auth';
  }
  if (!s.isAnonymous && !isKgpianEmail(s.email)) {
    await d.signOut();
    return '/signin?notkgp=1';
  }
  await ensureUser(d.db, { authId: s.id, email: s.email ?? null, name: s.name, isDemo: s.isAnonymous });
  return safeNext(d.next);
}
