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
        Check your connection and try again.
      </EmptyState>
    );
  if (status === 'anon' || !me)
    return (
      <EmptyState
        title="Sign in to continue"
        action={
          <div className="flex w-full flex-col gap-2">
            <Button variant="signal" onClick={() => void signInWithKgpGoogle(location.pathname + location.search)}>
              Sign in with KGP Google
            </Button>
            <a href="/" className="grid min-h-11 place-items-center text-sm font-bold underline">
              Or try the demo
            </a>
          </div>
        }
      >
        Hop is for IIT Kharagpur students.
      </EmptyState>
    );
  return <>{children(me, refresh)}</>;
}
