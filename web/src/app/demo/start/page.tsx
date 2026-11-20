'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, errorText } from '@/client/api';
import { startAnonymousSession } from '@/client/auth';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui';

type State = { kind: 'opening' } | { kind: 'student'; name: string } | { kind: 'error'; text: string };

function Start() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ kind: 'opening' });
  const ran = useRef(false);

  const open = useCallback(
    async (fresh: boolean) => {
      setState({ kind: 'opening' });
      try {
        const supabase = createSupabaseBrowser();
        if (fresh) await supabase.auth.signOut();
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (u && !u.is_anonymous) {
          setState({ kind: 'student', name: (u.user_metadata?.full_name as string) ?? u.email ?? 'a student' });
          return;
        }
        await startAnonymousSession();
        const { lobbyId } = await api.send<{ lobbyId: string }>('POST', '/api/demo');
        router.replace(`/l/${lobbyId}`);
      } catch (e) {
        setState({ kind: 'error', text: e instanceof ApiError ? errorText(e) : 'The demo couldn’t start. Check your connection and try again.' });
      }
    },
    [router],
  );

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void open(params.get('fresh') === '1');
  }, [open, params]);

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-xs flex-col items-center gap-4 text-center">
        <p className="flex items-center gap-2 font-display text-3xl font-semibold italic">
          <span aria-hidden className="brass inline-block h-2.5 w-2.5 rounded-full" />
          Hop
        </p>
        {state.kind === 'opening' && (
          <p role="status" className="flex items-center gap-2 text-muted">
            <span aria-hidden className="brass pulse inline-block h-3 w-3 rounded-full" />
            Opening your demo room…
          </p>
        )}
        {state.kind === 'student' && (
          <>
            <p className="text-muted">You’re signed in as {state.name}. The demo runs as a separate guest, so it never mixes with your real trips.</p>
            <Button variant="signal" className="w-full" onClick={() => void open(true)}>Sign out and start the demo</Button>
            <a href="/home" target="_top" className="grid min-h-11 w-full place-items-center rounded-full border border-line bg-surface font-bold">Go to your trips</a>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <p role="alert" className="text-stop">{state.text}</p>
            <Button variant="signal" className="w-full" onClick={() => void open(false)}>Try again</Button>
          </>
        )}
      </div>
    </main>
  );
}

export default function DemoStart() {
  return (
    <Suspense fallback={null}>
      <Start />
    </Suspense>
  );
}
