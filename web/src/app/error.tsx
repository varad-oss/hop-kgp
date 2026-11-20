'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-16">
      <h1 className="font-display text-[34px] font-semibold leading-tight">This screen hit a problem</h1>
      <p className="mt-2 text-muted">
        Nothing you posted was lost: trips, plans and votes are saved on the server as you make them. Try loading the screen again.
      </p>
      {error.digest ? <p className="mt-2 text-sm text-muted">Reference: <span className="num">{error.digest}</span></p> : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={reset} className="brass grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm">Try again</button>
        <Link href="/home" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold">Your trips</Link>
      </div>
    </main>
  );
}
