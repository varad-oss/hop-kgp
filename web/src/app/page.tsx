import { Suspense } from 'react';
import { LandingActions } from '@/components/LandingActions';
import { LiveCounter } from '@/components/LiveCounter';
import { TicketCard } from '@/components/cards';
import type { HopTicket } from '@/domain/cards';

const SAMPLE: HopTicket = {
  podId: 'sample',
  proposalId: 'sample',
  destination: 'HWH',
  direction: 'out',
  departAt: '2026-11-26T01:00:00Z',
  meetingPoint: 'Main Building gate',
  vehicle: 'sedan',
  totalFare: 2800,
  each: 934,
  over: 2,
  seats: 4,
  freeSeats: 1,
  isDemo: true,
  members: [
    { nexconnId: 'a', name: 'Aarav', hall: 'Azad', phone: 'Shown after lock' },
    { nexconnId: 'b', name: 'Meera', hall: 'SN/IG', phone: 'Shown after lock' },
    { nexconnId: 'c', name: 'Riya', hall: 'Nehru', phone: 'Shown after lock' },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-0 py-8">
      <header className="px-5">
        <p className="font-display text-2xl font-semibold">Hop</p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.02]">Going home? Split the ride with KGP.</h1>
        <p className="mt-3 max-w-[34ch] text-lg text-muted">
          Say where you’re headed. Join the room for that day, agree a plan in chat, lock it, and the fare splits itself.
        </p>
      </header>
      <div aria-label="Sample trip ticket">
        <TicketCard ticket={SAMPLE} />
        <p className="mt-2 px-5 text-sm text-muted">A sample ticket. Real ones show everyone’s numbers once the trip is locked.</p>
      </div>
      <div className="flex flex-col gap-3 px-5">
        <Suspense fallback={null}>
          <LandingActions />
        </Suspense>
        <LiveCounter />
      </div>
    </main>
  );
}
