'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '@/client/api';
import { connectNexconn } from '@/client/nexconn';
import type { TripOverview } from '@/client/trips';
import { AppShell, RowList, Section, Skeleton } from '@/components/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { Button, ErrorNote } from '@/components/ui';
import { DESTINATIONS } from '@/domain/catalog';
import { formatTime, formatTripDate } from '@/domain/copy';
import { formatINR } from '@/domain/fare';

type Tone = 'go' | 'act' | 'quiet';

function status(t: TripOverview): { text: string; tone: Tone; href: string } {
  const room = `/l/${t.lobbyId}`;
  switch (t.stage) {
    case 'locked':
      return { text: `Locked. ${formatTime(t.trip!.departAt)} from ${t.trip!.meetingPoint}, ${formatINR(t.trip!.each)} each`, tone: 'go', href: `/pod/${t.trip!.podId}` };
    case 'lock_ready':
      return { text: `${t.myPlan!.inCount} in your plan. You can lock it now.`, tone: 'act', href: room };
    case 'waiting':
      return { text: `You’re in a plan for ${formatTime(t.myPlan!.departAt)}. Waiting for one more person.`, tone: 'act', href: room };
    case 'pick_plan':
      return { text: `${t.openPlans} ${t.openPlans === 1 ? 'plan is' : 'plans are'} open. Pick one or propose your own.`, tone: 'act', href: room };
    case 'no_plans':
      return { text: `${t.going} going. No plan yet: propose a time.`, tone: 'quiet', href: room };
    case 'ended':
      return { text: t.trip ? `Trip ended. ${t.trip.people} travelled, ${formatINR(t.trip.each)} each.` : 'This day has passed.', tone: 'quiet', href: t.trip ? `/pod/${t.trip.podId}` : room };
  }
}

const DOT: Record<Tone, string> = { go: 'bg-go', act: 'brass', quiet: 'bg-muted/50' };

function DateBlock({ date }: { date: string }) {
  const [dow, day, mon] = formatTripDate(date).split(' ');
  return (
    <span className="flex w-12 shrink-0 flex-col items-center leading-none" aria-hidden>
      <span className="text-[11px] font-bold text-muted">{dow}</span>
      <span className="font-display text-[28px] font-semibold num">{day}</span>
      <span className="text-[11px] font-bold text-muted">{mon}</span>
    </span>
  );
}

function TripRow({ t }: { t: TripOverview }) {
  const s = status(t);
  const place = DESTINATIONS[t.destination].label;
  return (
    <li>
      <Link href={s.href} className="flex min-h-[72px] items-center gap-3 px-3 py-3 hover:bg-surface-2">
        <DateBlock date={t.date} />
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug">
            {t.direction === 'back' ? `${place} to KGP` : `KGP to ${place}`}
            <span className="sr-only">, {formatTripDate(t.date)}</span>
          </span>
          <span className="mt-0.5 flex items-start gap-2 text-sm text-muted">
            <span aria-hidden className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${DOT[s.tone]}`} />
            <span>{s.text}</span>
          </span>
        </span>
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
      </Link>
    </li>
  );
}

function NextDeparture({ t }: { t: TripOverview }) {
  const trip = t.trip!;
  const place = DESTINATIONS[t.destination].label;
  const [time, ampm] = formatTime(trip.departAt).split(' ');
  return (
    <Link href={`/pod/${trip.podId}`} className="lacquer lacquer-frame block overflow-hidden rounded-[22px] text-on-ticket shadow-md">
      <div className="flex">
        <div className="min-w-0 flex-1 p-4">
          <p className="text-sm text-on-ticket/75">{t.direction === 'back' ? 'Back to campus from' : 'From campus to'}</p>
          <p className="font-display text-[28px] font-semibold leading-tight">{place}</p>
          <p className="mt-2 font-display text-[40px] font-semibold leading-none num">
            {time} <span className="text-lg font-medium text-on-ticket/75">{ampm}</span>
          </p>
          <p className="mt-1 text-on-ticket/85">
            {formatTripDate(t.date)}, {trip.meetingPoint}
          </p>
        </div>
        <div className="brass flex w-28 shrink-0 flex-col justify-between p-3">
          <span>
            <span className="block text-sm font-bold">You pay</span>
            <span className="block font-display text-[30px] font-semibold leading-none num">{formatINR(trip.each)}</span>
            <span className="mt-1 block text-sm">{trip.people} travelling</span>
          </span>
          <span className="mt-3 text-sm font-bold underline underline-offset-2">Open ticket</span>
        </div>
      </div>
    </Link>
  );
}

function Trips() {
  const [trips, setTrips] = useState<TripOverview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    api
      .get<{ trips: TripOverview[] }>('/api/me/trips')
      .then((r) => setTrips(r.trips))
      .catch((e) => setError(errorText(e)));
  }, []);
  useEffect(() => {
    void connectNexconn().catch(() => {});
    load();
  }, [load]);

  if (error)
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorNote>Your trips didn’t load. {error}</ErrorNote>
        <Button variant="ghost" onClick={load}>Try again</Button>
      </div>
    );
  if (!trips) return <Skeleton rows={3} />;

  if (trips.length === 0)
    return (
      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm">
        <p className="font-display text-2xl font-semibold">Where are you headed?</p>
        <p className="mt-2 max-w-prose text-muted">
          Post the day and the station, and you’ll join the room with everyone from KGP going the same way. Or look at who’s already going first.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/new" className="brass grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm">Post a trip</Link>
          <Link href="/departures" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold hover:bg-surface-2">Browse departures</Link>
        </div>
      </div>
    );

  const upcoming = trips.filter((t) => !t.past);
  const locked = upcoming.filter((t) => t.stage === 'locked').sort((a, b) => a.trip!.departAt.localeCompare(b.trip!.departAt));
  const next = locked[0];
  const needs = upcoming.filter((t) => ['lock_ready', 'waiting', 'pick_plan'].includes(t.stage));
  const rest = upcoming.filter((t) => t !== next && !needs.includes(t));
  const past = trips.filter((t) => t.past).reverse();

  return (
    <>
      {next && (
        <Section title="Next departure">
          <NextDeparture t={next} />
        </Section>
      )}
      {needs.length > 0 && (
        <Section title="Needs you" count={needs.length}>
          <RowList>{needs.map((t) => <TripRow key={t.lobbyId} t={t} />)}</RowList>
        </Section>
      )}
      {rest.length > 0 && (
        <Section title="Upcoming" count={rest.length}>
          <RowList>{rest.map((t) => <TripRow key={t.lobbyId} t={t} />)}</RowList>
        </Section>
      )}
      {upcoming.length === 0 && (
        <p className="mb-8 text-muted">
          Nothing coming up. <Link href="/new" className="font-bold text-ink underline underline-offset-2">Post your next trip</Link> or{' '}
          <Link href="/departures" className="font-bold text-ink underline underline-offset-2">see who’s going</Link>.
        </p>
      )}
      {past.length > 0 && (
        <Section title="Last 7 days" count={past.length}>
          <RowList>{past.map((t) => <TripRow key={t.lobbyId} t={t} />)}</RowList>
        </Section>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <AppShell
      title="Trips"
      action={
        <Link href="/new" className="brass grid min-h-11 place-items-center rounded-full px-4 text-[15px] font-bold shadow-sm">
          Post a trip
        </Link>
      }
    >
      <AuthGate>{() => <Trips />}</AuthGate>
    </AppShell>
  );
}
