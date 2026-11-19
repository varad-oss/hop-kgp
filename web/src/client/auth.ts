import { createSupabaseBrowser } from '@/lib/supabase/browser';

export async function signInWithKgpGoogle(next?: string) {
  const supabase = createSupabaseBrowser();
  const redirectTo = `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { hd: 'kgpian.iitkgp.ac.in', prompt: 'select_account' } },
  });
}

export async function startAnonymousSession() {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}
