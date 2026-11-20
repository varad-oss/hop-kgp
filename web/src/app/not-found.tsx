import Link from 'next/link';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-14">
        <p className="font-display text-[64px] font-semibold leading-none text-muted num">404</p>
        <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">This page isn’t on the board</h1>
        <p className="mt-2 text-muted">
          The link may be mistyped, or the room or trip may belong to someone else. Trips and rooms are only visible to the people in them.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/home" className="brass grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm">Your trips</Link>
          <Link href="/departures" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold hover:bg-surface-2">Departures</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
