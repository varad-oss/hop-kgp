import { NextResponse, type NextRequest } from 'next/server';
import { handleCallback } from '@/server/auth';
import { getDb } from '@/server/db';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const supabase = await createSupabaseServer();
  if (url.searchParams.get('error')) {
    console.error('auth callback provider error', url.searchParams.get('error'), url.searchParams.get('error_code'), url.searchParams.get('error_description'));
  }
  const path = await handleCallback({
    db: getDb(),
    code: url.searchParams.get('code'),
    next: url.searchParams.get('next'),
    exchange: async (code) => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) {
        console.error('auth exchange failed', error?.name, error?.status, error?.message);
        throw error ?? new Error('no user');
      }
      const u = data.user;
      const meta = u.user_metadata as Record<string, unknown>;
      return {
        id: u.id,
        email: u.email,
        name: ((meta.full_name ?? meta.name) as string | undefined) || u.email?.split('@')[0] || 'KGPian',
        isAnonymous: !!u.is_anonymous,
      };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  });
  return NextResponse.redirect(new URL(path, url.origin));
}
