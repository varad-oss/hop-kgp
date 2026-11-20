import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import QRCode from 'qrcode';
import { CaptainNote, IntentCard } from '@/components/cards';
import { Container, SitePage } from '@/components/PublicChrome';
import { Board } from '@/components/site/Board';
import { HeroTicket } from '@/components/site/HeroTicket';
import { PlanPreview } from '@/components/site/PlanPreview';
import { SAMPLE_INTENTS } from '@/components/site/samples';
import { Scramble } from '@/components/site/Scramble';
import { getDb } from '@/server/db';
import { departures } from '@/server/overview';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hop-kgp.vercel.app';

async function LiveBoard() {
  await connection();
  const rows = await departures(getDb(), null).catch(() => null);
  return <Board rows={rows} />;
}

function BoardSkeleton() {
  return <div aria-hidden className="pulse h-[320px] rounded-[22px] bg-surface-2" />;
}

async function PhoneQr() {
  const qr = await QRCode.toString(SITE, { type: 'svg', margin: 0, color: { dark: '#12352a', light: '#00000000' } });
  return <div aria-hidden className="h-32 w-32 shrink-0 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />;
}

const PHASES = [
  { n: '01', title: 'Post your trip', body: 'Station, day, a time window and your bags. Ten seconds, no free text.' },
  { n: '02', title: 'Land in the room', body: 'Everyone going your way that day is already there, with their hall and window.' },
  { n: '03', title: 'Lock one plan', body: 'Tap I’m in on a time and meeting point. Two in, and anyone can lock it.' },
  { n: '04', title: 'Travel together', body: 'A private trip with a ticket, numbers, chat and a captain who catches you up.' },
];

const NEW_HERE = [
  ['Rooms that form themselves', 'You never search or ask around. Posting “Howrah, Wednesday” puts you in the one room for it.', '/how-it-works#room'],
  ['Plans you can count', 'A plan is a card, not a message. Its “3 in” and fare update on every phone the moment someone taps.', '/how-it-works#lock'],
  ['Lock, then split', 'Locking turns the plan into a ticket. Join or leave later and the fare re-splits for everyone.', '/how-it-works#lock'],
  ['A number shield', 'Phone numbers typed into a room are blocked before delivery. Numbers appear only inside a locked trip.', '/how-it-works#shared'],
  ['A trip captain', '“Catch me up” streams a short summary of the plan and the chat into the trip, word by word.', '/how-it-works#travel'],
];

const SDK = [
  ['Group channels', 'Rooms and private trips, created by our server'],
  ['Custom messages', 'Hop:Intent, Hop:Proposal, Hop:Ticket cards'],
  ['Message metadata', 'Live “3 in” counts and lock state'],
  ['Read receipts', '“Seen by 2” in every trip'],
  ['Streaming messages', 'The trip captain, chunk by chunk'],
  ['Pre-messaging webhook', 'Blocks phone numbers in rooms'],
  ['Connection handling', 'Reconnect, campus-WiFi and kicked states'],
  ['Server tokens', 'The App Secret stays on the server'],
];

export default function Home() {
  return (
    <SitePage>
      {/* Hero */}
      <Container className="grid gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6 xl:col-span-5">
          <p className="text-[15px] font-bold text-muted">For IIT Kharagpur students going home</p>
          <h1 className="mt-4 font-display text-[48px] font-semibold leading-[1.02] md:text-[64px] xl:text-[72px]">The ride home, sorted in one room.</h1>
          <p className="mt-6 max-w-[44ch] text-lg text-muted md:text-xl">
            Everyone from KGP heading to Howrah, Kolkata airport, Santragachi or Kharagpur station on your day, in one room that ends in a locked plan and a fare that splits itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="brass grid min-h-12 place-items-center rounded-full px-6 text-base font-bold shadow-sm">
              Try the live demo
            </Link>
            <Link href="/signin" className="grid min-h-12 place-items-center rounded-full border border-line bg-surface px-6 text-base font-bold hover:bg-surface-2">
              Sign in with KGP Google
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">The demo needs no account and takes about a minute.</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <HeroTicket />
        </div>
      </Container>

      {/* Who's going */}
      <section aria-labelledby="board" className="pb-24">
        <Container className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Suspense fallback={<BoardSkeleton />}>
              <LiveBoard />
            </Suspense>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <h2 id="board" className="font-display text-[32px] font-semibold leading-[1.1] md:text-[40px]">One room per station, per day</h2>
            <p className="mt-4 text-lg text-muted">
              Post “Howrah, Wednesday” and you join the one room for it. Before you post, signed-in students can see every upcoming room on the departures board, with counts only.
            </p>
          </div>
        </Container>
      </section>

      {/* The problem */}
      <section aria-labelledby="problem" className="border-y border-line bg-surface/60 py-20">
        <Container className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h2 id="problem" className="font-display text-[38px] font-semibold leading-[1.08] md:text-[48px]">
              Today, the ride home starts in a group chat that never decides.
            </h2>
            <p className="mt-5 max-w-[48ch] text-lg text-muted">
              Every vacation, thousands of students leave the same campus within a few days. Finding a co-passenger means posting in hall groups, where posts get buried, numbers are shared with hundreds of strangers, and there’s no way to know who has committed.
            </p>
            <p className="mt-4 max-w-[48ch] text-lg">
              Hop keeps the conversation and adds the missing part: <strong>a plan everyone can see, join and lock.</strong>
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:col-span-7">
            <Scramble />
            <div className="flex flex-col gap-3">
              <p className="flex items-center justify-between px-3 text-sm font-bold">
                The same need in Hop <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">Sample</span>
              </p>
              <div className="-mx-3">
                <PlanPreview inCount={3} />
              </div>
              <p className="px-3 text-sm text-muted">One card: who’s in, what each person pays, and what the next person would pay.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="how" className="max-w-[20ch] font-display text-[38px] font-semibold leading-[1.08] md:text-[48px]">From “anyone going?” to a ticket in four steps.</h2>
            <Link href="/how-it-works" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold hover:bg-surface-2">
              See each step in detail
            </Link>
          </div>
          <ol className="mt-12 grid gap-12 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
            {PHASES.map((p, i) => (
              <li key={p.n} className="flex flex-col">
                <span className="font-display text-[40px] font-semibold leading-none text-muted num">{p.n}</span>
                <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-muted">{p.body}</p>
                <div className="mt-5">
                  {i === 0 && (
                    <div className="flex flex-wrap gap-2 rounded-[18px] border border-line bg-surface p-4 text-sm font-bold shadow-sm" aria-label="Sample trip post">
                      {['Leaving KGP', 'Howrah', 'Wed 25 Nov', '6–9 AM', '2 bags'].map((c, j) => (
                        <span key={c} className={`rounded-full border px-3 py-1.5 ${j < 4 ? 'border-ink bg-ink text-bg' : 'border-line'}`}>{c}</span>
                      ))}
                    </div>
                  )}
                  {i === 1 && <div className="-mx-3 flex flex-col gap-2">{SAMPLE_INTENTS.map((t) => <IntentCard key={t.intentId} intent={t} />)}</div>}
                  {i === 2 && (
                    <div className="-mx-3">
                      <PlanPreview inCount={3} status="locked" />
                    </div>
                  )}
                  {i === 3 && <CaptainNote text="Aarav, Meera and Riya leave at 6:30 AM from the Main Building gate. Sedan, ₹934 each, one seat open. Still to settle: who books the cab." />}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-muted">Cards shown with sample data. In the product they are live and update on every phone in the room.</p>
        </Container>
      </section>

      {/* What's new */}
      <section aria-labelledby="new" className="lacquer py-24 text-on-ticket">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="new" className="font-display text-[38px] font-semibold leading-[1.08] md:text-[48px]">What a group chat can’t do</h2>
            <p className="mt-5 text-lg text-on-ticket/80">Hop is still a chat, built on the Nexconn Chat SDK. These five interactions are what make it end in a decision.</p>
          </div>
          <dl className="divide-y divide-ticket-line border-y border-ticket-line lg:col-span-8">
            {NEW_HERE.map(([t, d, href]) => (
              <div key={t} className="grid gap-2 py-6 md:grid-cols-[15rem_1fr_auto] md:items-baseline md:gap-8">
                <dt className="font-display text-2xl font-semibold">{t}</dt>
                <dd className="text-on-ticket/85">{d}</dd>
                <dd>
                  <Link href={href} className="text-sm font-bold underline underline-offset-4">
                    See how<span className="sr-only">: {t}</span>
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Built on Nexconn */}
      <section aria-labelledby="sdk" className="py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="sdk" className="font-display text-[38px] font-semibold leading-[1.08] md:text-[48px]">Built on the Nexconn Chat SDK</h2>
            <p className="mt-5 max-w-[46ch] text-lg text-muted">
              Every room and trip is a Nexconn group channel. Plans and tickets are custom messages, votes travel as message metadata, and the captain is a streaming message. Postgres stays the source of truth.
            </p>
            <Link href="/built-on-nexconn" className="mt-6 inline-grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold hover:bg-surface-2">
              Architecture and every SDK feature
            </Link>
          </div>
          <ul className="grid content-start gap-x-8 sm:grid-cols-2 lg:col-span-7">
            {SDK.map(([k, v]) => (
              <li key={k} className="border-b border-line py-4">
                <span className="block font-bold">{k}</span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Try it */}
      <section aria-labelledby="try">
        <Container>
          <div className="lacquer lacquer-frame grid gap-10 overflow-hidden rounded-[28px] p-8 text-on-ticket md:p-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 id="try" className="font-display text-[38px] font-semibold leading-[1.08] md:text-[48px]">Two ways in</h2>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-xl font-bold">Judging, or not at KGP?</p>
                  <p className="mt-2 text-on-ticket/80">A private demo room with two sample travellers. Lock a trip, watch the fare re-split, and ask the captain. About a minute.</p>
                  <Link href="/demo" className="brass mt-4 inline-grid min-h-12 place-items-center rounded-full px-6 font-bold">Try the live demo</Link>
                </div>
                <div>
                  <p className="text-xl font-bold">A KGP student?</p>
                  <p className="mt-2 text-on-ticket/80">Sign in with your @kgpian.iitkgp.ac.in account and post your trip. Your number stays hidden until you lock.</p>
                  <Link href="/signin" className="mt-4 inline-grid min-h-12 place-items-center rounded-full border border-ticket-line px-6 font-bold hover:bg-on-ticket/10">Sign in with KGP Google</Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 rounded-[20px] bg-on-ticket p-6 text-[#0f1f1a] lg:col-span-5">
              <Suspense fallback={<div className="h-32 w-32" />}>
                <PhoneQr />
              </Suspense>
              <div>
                <p className="font-bold">Open Hop on your phone</p>
                <p className="mt-1 text-sm opacity-75">Hop is made for phones. Scan to try the same demo the way students use it.</p>
                <p className="mt-2 break-all text-sm font-bold">{SITE.replace('https://', '')}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </SitePage>
  );
}
