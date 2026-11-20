import { createSupabaseServer } from '@/lib/supabase/server';
import { assertAllowedUser, ensureUser, type UserRow } from './auth';
import { getDb } from './db';
import { HttpError } from './http';

function displayName(meta: Record<string, unknown> | undefined, email: string | undefined, anon: boolean): string {
  if (anon) return 'Demo guest';
  const n = (meta?.full_name ?? meta?.name) as string | undefined;
  return (n && n.trim()) || email?.split('@')[0] || 'KGPian';
}

export async function requireUser(): Promise<UserRow> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const u = data.user;
  if (error || !u) throw new HttpError(401, 'unauthorized');
  const anon = !!u.is_anonymous;
  assertAllowedUser({ email: u.email, isAnonymous: anon });
  return ensureUser(getDb(), {
    authId: u.id,
    email: u.email ?? null,
    name: displayName(u.user_metadata, u.email, anon),
    isDemo: anon,
  });
}
