'use client';
import type { ReactNode } from 'react';
import { signInWithKgpGoogle } from '@/client/auth';
import { useMe, type Me } from '@/client/useMe';
import { Button, EmptyState, Spinner } from './ui';

export function AuthGate({ children }: { children: (me: Me, refresh: () => Promise<unknown>) => ReactNode }) {
  const { status, me, refresh } = useMe();
  if (status === 'loading') return <Spinner />;
  if (status === 'error')
    return (
      <EmptyState title="Can’t reach Hop" action={<Button onClick={() => location.reload()}>Try again</Button>}>
        Your phone couldn’t reach the Hop server. Check your connection, or switch between WiFi and mobile data, then try again.
      </EmptyState>
    );
  if (status === 'anon' || !me)
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-3 py-8">
        <h2 className="font-display text-[28px] font-semibold leading-tight">Sign in or sign up to see this</h2>
        <p className="text-muted">Hop is for IIT Kharagpur students. Continue with your @kgpian.iitkgp.ac.in email ID (new or returning) and you’ll come straight back here.</p>
        <Button variant="signal" className="min-h-12" onClick={() => void signInWithKgpGoogle(location.pathname + location.search)}>
          Continue with KGP email ID
        </Button>
        <a href="/" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface font-bold">
          Not at KGP? Try the demo
        </a>
      </div>
    );
  return <>{children(me, refresh)}</>;
}
