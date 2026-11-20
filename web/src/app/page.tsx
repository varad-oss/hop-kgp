import Link from 'next/link';
import { Suspense } from 'react';
import { LandingActions } from '@/components/LandingActions';
import { LiveCounter } from '@/components/LiveCounter';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
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

const STEPS = [
  ['Post your trip', 'Station, day, time window, bags. You land in that day’s room.'],
  ['Pick a plan', 'Tap I’m in on a time and meeting point, or propose one.'],
  ['Lock it', 'Two or more in and anyone can lock. Numbers appear for the group.'],
  ['Travel', 'Seats stay open until you leave. Joins and leaves re-split the fare.'],
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-0 md:px-6">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:items-center md:gap-10 md:py-10">
          <header className="px-5 pt-8 md:px-0 md:pt-0">
            <h1 className="font-display text-[44px] font-medium leading-[1.05] md:text-[46px] lg:text-[50px]">Going home? Split the ride with KGP.</h1>
            <p className="mt-3 max-w-[34ch] text-lg text-muted">
              Say where you’re headed. Join the room for that day, agree a plan in chat, lock it, and the fare splits itself.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Suspense fallback={null}>
                <LandingActions />
              </Suspense>
              <LiveCounter />
            </div>
          </header>
          <div aria-label="Sample trip ticket" className="mt-10 md:mt-0">
            <TicketCard ticket={SAMPLE} />
            <p className="mt-2 px-5 text-sm text-muted md:px-3">A sample ticket. Real ones show everyone’s numbers once the trip is locked.</p>
          </div>
        </div>

        <section aria-labelledby="how" className="mt-14 px-5 md:px-0">
          <h2 id="how" className="font-display text-[30px] font-semibold leading-tight">From WhatsApp chaos to one locked plan</h2>
          <ol className="mt-5 grid gap-5 md:grid-cols-4 md:gap-6">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-3 md:block">
                <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-xl font-semibold text-bg">{i + 1}</span>
                <span className="md:mt-3 md:block">
                  <span className="block font-bold">{title}</span>
                  <span className="mt-1 block text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="shared" className="mt-14 px-5 md:px-0">
          <h2 id="shared" className="font-display text-[30px] font-semibold leading-tight">Your number stays yours until you lock</h2>
          <dl className="mt-5 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
            {[
              ['In a room', 'Name, hall, time window and bags.'],
              ['In a locked trip', 'Your mobile number, only for the people in that trip.'],
              ['Typed into a room', 'Phone numbers are blocked before delivery.'],
              ['Departures board', 'Counts and times. No names.'],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 md:grid-cols-[12rem_1fr]">
                <dt className="font-bold">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted">
            Only @kgpian.iitkgp.ac.in accounts can sign in. <Link href="/help#shared" className="underline underline-offset-2">More on privacy and safety</Link>
          </p>
        </section>

        <section aria-labelledby="faq" className="mt-14 px-5 md:px-0">
          <h2 id="faq" className="font-display text-[30px] font-semibold leading-tight">Questions</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {[
              ['Does Hop book the cab?', 'No. You agree a plan and a fare; one of you books the cab, toto or agency car as usual. Hop keeps everyone and the split in one place.'],
              ['How is the fare split?', 'The total fare divided by the people in the plan, rounded up to the rupee. It updates when someone joins or leaves.'],
              ['What if nobody’s going my way?', 'Post anyway. Anyone who posts the same station and day joins your room, and you can propose a plan for them to join.'],
              ['Is the demo real?', 'It’s a private room with two sample travellers so you can try every step. It never touches real students’ rooms.'],
            ].map(([q, a]) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold">
                  {q}
                  <span aria-hidden className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-3 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
