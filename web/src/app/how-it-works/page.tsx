import Link from 'next/link';
import type { ReactNode } from 'react';
import { CaptainNote, IntentCard, TicketCard } from '@/components/cards';
import { Container, PageIntro, SitePage } from '@/components/PublicChrome';
import { PlanPreview } from '@/components/site/PlanPreview';
import { SAMPLE_INTENTS, sampleTicket } from '@/components/site/samples';

export const metadata = { title: 'How it works', description: 'How Hop takes IIT Kharagpur students from posting a trip to a locked plan with a split fare.' };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function Step({ id, n, title, children, visual, flip }: { id: string; n: string; title: string; children: ReactNode; visual: ReactNode; flip?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line py-16">
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className={`lg:col-span-5 ${flip ? 'lg:order-2 lg:col-start-8' : ''}`}>
          <p className="font-display text-[40px] font-semibold leading-none text-muted num">{n}</p>
          <h2 id={`${id}-h`} className="mt-3 font-display text-[34px] font-semibold leading-tight md:text-[40px]">{title}</h2>
          <div className="mt-4 flex flex-col gap-3 text-lg text-muted [&_strong]:text-ink">{children}</div>
        </div>
        <div className={`lg:col-span-6 ${flip ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-7'}`}>{visual}</div>
      </Container>
    </section>
  );
}

function SampleLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 flex items-center justify-between px-3 text-sm font-bold">
      {children}
      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">Sample</span>
    </p>
  );
}

const FAQ: [string, ReactNode][] = [
  ['Do I need to post a trip to see who’s going?', <>No. Signed-in students can open the departures board to see every upcoming room, with how many are going and what’s planned. To see names and join a plan, post your trip into that room.</>],
  ['Can I be in two trips on the same day?', 'Not in the same room. Locking one plan takes you out of the others, so nobody gets double-counted.'],
  ['What if my plans change after locking?', 'Open the trip and tap Leave. Your seat opens and the others see the new split straight away.'],
  ['Does Hop book the cab or take payment?', 'No. One of you books the cab, toto or agency car as usual. Hop keeps the group, the plan and the split in one place.'],
  ['Does the AI see my number?', '“Catch me up” sends only the trip details, names and recent chat text to the model, never phone numbers. Its note is labelled “Trip captain” so it can’t be mistaken for a person.'],
  ['Chat won’t connect on campus WiFi.', 'Some networks block chat connections. Switch to mobile data and tap Reconnect. Trips and tickets still load either way.'],
  ['Can I try it without a KGP account?', <>Yes. <Link href="/demo" className="underline">The demo</Link> opens a private room with two sample travellers. Nothing there reaches real students, and it isn’t counted in Hop’s numbers.</>],
];

export default function HowItWorks() {
  return (
    <SitePage current="/how-it-works">
      <PageIntro
        title="From “anyone going?” to a locked trip"
        lead="Hop has four steps. Each one replaces a part of the hall-group scramble with something you can see, count and rely on."
      >
        <nav aria-label="On this page" className="flex flex-wrap gap-2 text-sm lg:justify-end">
          {[
            ['#post', 'Post'],
            ['#room', 'Room'],
            ['#lock', 'Lock'],
            ['#travel', 'Travel'],
            ['#fares', 'Fares'],
            ['#shared', 'Privacy'],
            ['#faq', 'Questions'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="grid min-h-10 place-items-center rounded-full border border-line bg-surface px-3.5 font-bold hover:bg-surface-2">
              {label}
            </a>
          ))}
        </nav>
      </PageIntro>

      <Step
        id="post"
        n="01"
        title="Post your trip"
        visual={
          <div className="rounded-[22px] border border-line bg-surface p-6 shadow-sm">
            <SampleLabel>What you choose</SampleLabel>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-3 px-3 text-[15px]">
              <dt className="text-muted">Direction</dt><dd className="font-bold">Leaving KGP</dd>
              <dt className="text-muted">Station</dt><dd className="font-bold">Howrah, Kolkata airport (CCU), Santragachi or Kharagpur station</dd>
              <dt className="text-muted">Day</dt><dd className="font-bold">Any day until 31 Jan, so return trips work too</dd>
              <dt className="text-muted">Window</dt><dd className="font-bold">Before 6 AM, 6–9 AM, 9–12, 12–4 PM, 4–8 PM, after 8 PM</dd>
              <dt className="text-muted">Large bags</dt><dd className="font-bold">0 to 6, so plans know if a sedan will fit</dd>
            </dl>
          </div>
        }
      >
        <p>Pick leaving or coming back, the station, the day, a time window and how many large bags you have. There’s no free text to write and no group to find.</p>
        <p>Signing up needs a <strong>KGP email ID</strong> (@kgpian.iitkgp.ac.in), checked on the server, so everyone you meet is a student.</p>
      </Step>

      <Step
        id="room"
        n="02"
        title="Land in the room for that day"
        flip
        visual={
          <div>
            <SampleLabel>Two people already in the room</SampleLabel>
            <div className="-mx-3 flex flex-col gap-2">{SAMPLE_INTENTS.map((t) => <IntentCard key={t.intentId} intent={t} />)}</div>
          </div>
        }
      >
        <p>There is exactly <strong>one room per station, direction and day</strong>. Posting puts you in it, alongside everyone else going your way, with their hall, window and bags.</p>
        <p>The room is a chat, so you can talk. But what matters happens on cards.</p>
      </Step>

      <Step
        id="lock"
        n="03"
        title="Join a plan, then lock it"
        visual={
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <SampleLabel>Open plan</SampleLabel>
              <div className="-mx-3"><PlanPreview inCount={2} /></div>
            </div>
            <div>
              <SampleLabel>Locked</SampleLabel>
              <div className="-mx-3"><PlanPreview inCount={3} status="locked" /></div>
            </div>
          </div>
        }
      >
        <p>A plan is a departure time, a meeting point, a vehicle, the total fare and the number of seats. Tap <strong>I’m in</strong> and every phone in the room sees the count and the fare per person change.</p>
        <p>With two or more in, anyone in the plan can <strong>lock</strong> it. Locking opens a private trip and takes everyone in it out of other plans that day.</p>
      </Step>

      <Step
        id="travel"
        n="04"
        title="Travel with a ticket, not a thread"
        flip
        visual={
          <div className="grid gap-5">
            <div>
              <SampleLabel>The trip ticket after Riya joins</SampleLabel>
              <TicketCard ticket={sampleTicket(3)} />
            </div>
            <div className="mx-3">
              <CaptainNote text="Aarav, Meera and Riya leave at 6:30 AM from the Main Building gate. Sedan, ₹934 each, one seat open. Still to settle: who books the cab." />
            </div>
          </div>
        }
      >
        <p>The trip has a ticket with the time, meeting point, everyone’s number and what you pay. It also has a private chat with “Seen by” receipts and quick replies like “At the gate”.</p>
        <p>Seats stay open until departure. <strong>Anyone who joins or leaves re-splits the fare</strong>, and the ticket says why.</p>
        <p>Tap <strong>Catch me up</strong> and the trip captain streams a short summary of the plan and what’s still unsettled.</p>
      </Step>

      <section id="fares" aria-labelledby="fares-h" className="scroll-mt-24 border-t border-line py-16">
        <Container className="grid gap-10 lg:grid-cols-12">
          <h2 id="fares-h" className="font-display text-[34px] font-semibold leading-tight md:text-[40px] lg:col-span-4">Fares</h2>
          <div className="flex flex-col gap-3 text-lg text-muted lg:col-span-7 lg:col-start-6">
            <p>The person proposing a plan enters the total fare, whatever the cab, toto or agency quoted. Hop divides it by the people in the plan and <strong className="text-ink">rounds each share up to the next rupee</strong>. So a ₹2,800 cab for three is ₹934 each, ₹2 over.</p>
            <p>Hop doesn’t take payments or book vehicles. You pay the driver, or each other, the way you normally would.</p>
          </div>
        </Container>
      </section>

      <section id="shared" aria-labelledby="shared-h" className="scroll-mt-24 border-t border-line py-16">
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="shared-h" className="font-display text-[34px] font-semibold leading-tight md:text-[40px]">What’s shared, and when</h2>
            <p className="mt-3 text-muted">More in the <Link href="/privacy" className="underline">privacy policy</Link>.</p>
          </div>
          <dl className="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm lg:col-span-7 lg:col-start-6">
            {[
              ['In a room', 'Name, hall, time window and bags.'],
              ['In a locked trip', 'Your mobile number, only for the people in that trip.'],
              ['Typed into a room', 'Phone numbers are blocked before they’re delivered, by a Nexconn pre-messaging webhook.'],
              ['On the board and share links', 'Counts and times only. Never names or numbers.'],
              ['Sent to the AI captain', 'Trip details, names and recent chat text. Never numbers.'],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-4 md:grid-cols-[13rem_1fr]">
                <dt className="font-bold">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section id="safety" aria-labelledby="safety-h" className="scroll-mt-24 border-t border-line py-16">
        <Container className="grid gap-10 lg:grid-cols-12">
          <h2 id="safety-h" className="font-display text-[34px] font-semibold leading-tight md:text-[40px] lg:col-span-4">Safety</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-lg text-muted lg:col-span-7 lg:col-start-6">
            <li>Only @kgpian.iitkgp.ac.in Google accounts can sign in, and the server checks every request, not just the app.</li>
            <li>Meet at a campus gate, check the vehicle number in the trip chat before you get in, and tell a friend your plan.</li>
            <li>If someone makes you uncomfortable, leave the trip (your seat reopens and the fare re-splits) and {contact ? <a className="underline" href={`mailto:${contact}`}>email us</a> : 'tell us using the feedback form at the end of the trip'}.</li>
          </ul>
        </Container>
      </section>

      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-24 border-t border-line py-16">
        <Container className="grid gap-10 lg:grid-cols-12">
          <h2 id="faq-h" className="font-display text-[34px] font-semibold leading-tight md:text-[40px] lg:col-span-4">Questions</h2>
          <div className="divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {q}
                  <span aria-hidden className="text-2xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <Container className="pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-line bg-surface p-6 shadow-sm">
          <p className="text-lg font-bold">See all four steps work in about a minute.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/demo" className="brass grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm">Try the live demo</Link>
            <Link href="/built-on-nexconn" className="grid min-h-11 place-items-center rounded-full border border-line px-5 font-bold hover:bg-surface-2">How it’s built</Link>
          </div>
        </div>
      </Container>
    </SitePage>
  );
}
