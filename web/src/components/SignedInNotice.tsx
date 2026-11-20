'use client';
import Link from 'next/link';
import { useMe } from '@/client/useMe';

/** On the sign-in page, a signed-in student gets a way straight back in. */
export function SignedInNotice() {
  const { status, me } = useMe();
  if (status !== 'ready' || !me || me.isDemo) return null;
  return (
    <div role="status" className="mt-6 flex items-center justify-between gap-3 rounded-[18px] border border-line bg-surface-2 px-4 py-3">
      <span className="min-w-0">
        <span className="block font-bold">You’re signed in as {me.name}</span>
        <span className="block truncate text-sm text-muted">{me.email}</span>
      </span>
      <Link href="/home" className="grid min-h-11 shrink-0 place-items-center rounded-full bg-go px-4 font-bold text-on-go">Continue</Link>
    </div>
  );
}
