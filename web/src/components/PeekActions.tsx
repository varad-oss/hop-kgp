'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { signInWithKgpGoogle } from '@/client/auth';
import { markLinkOpen } from '@/client/funnel';
import { useMe } from '@/client/useMe';
import { Button } from './ui';

export function PeekActions({ next }: { next: string }) {
  const { status } = useMe();
  useEffect(markLinkOpen, []);
  if (status === 'ready')
    return (
      <Link href={next} className="grid min-h-12 place-items-center brass shadow-sm rounded-full px-6 text-base font-bold">
        Join this plan
      </Link>
    );
  return (
    <div className="flex flex-col gap-2">
      <Button variant="signal" className="min-h-12 text-base" onClick={() => void signInWithKgpGoogle(next)}>
        Continue with KGP email ID to join
      </Button>
      <p className="text-sm text-muted">Names and numbers stay hidden until you’re in and the trip is locked.</p>
    </div>
  );
}
