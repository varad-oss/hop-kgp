'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, errorText } from '@/client/api';
import { signInWithKgpGoogle, startAnonymousSession } from '@/client/auth';
import { markLinkOpen } from '@/client/funnel';
import { Button, ErrorNote } from './ui';

export function LandingActions() {
  const params = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState<'google' | 'demo' | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(markLinkOpen, []);

  const notKgp = params.get('notkgp') === '1';
  const next = params.get('next') ?? undefined;

  async function google() {
    setBusy('google');
    setError(null);
    try {
      await signInWithKgpGoogle(next);
    } catch {
      setError('Could not start Google sign-in. Try again.');
      setBusy(null);
    }
  }

  async function demo() {
    setBusy('demo');
    setError(null);
    try {
      await startAnonymousSession();
      const { lobbyId } = await api.send<{ lobbyId: string }>('POST', '/api/demo');
      router.push(`/l/${lobbyId}`);
    } catch (e) {
      setError(errorText(e));
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {notKgp && (
        <ErrorNote>That Google account isn’t an @kgpian.iitkgp.ac.in address, so you weren’t signed in. Choose your KGP account on the next screen, or try the demo.</ErrorNote>
      )}
      {params.get('error') === 'auth' && <ErrorNote>Google sign-in didn’t finish, perhaps because it was cancelled or the link expired. Tap the button to start again.</ErrorNote>}
      <Button variant="signal" busy={busy === 'google'} onClick={google} className="min-h-12 text-base">
        Sign in with KGP Google
      </Button>
      <Button variant="ghost" busy={busy === 'demo'} onClick={demo} className="min-h-12 text-base">
        Try the demo
      </Button>
      {error && <ErrorNote>{error}</ErrorNote>}
      <p className="text-sm text-muted">The demo needs no account. Your number is only shared with the trip you lock.</p>
    </div>
  );
}
