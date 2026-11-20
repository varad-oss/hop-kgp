'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api, errorText } from '@/client/api';
import { istToday, type Departure } from '@/client/trips';
import type { Me } from '@/client/useMe';
import { AppShell, Skeleton } from '@/components/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { Button, ErrorNote } from '@/components/ui';
import { DESTINATIONS, type DestKey } from '@/domain/catalog';
import { formatTime, formatTripDate } from '@/domain/copy';

const DESTS = Object.keys(DESTINATIONS) as DestKey[];

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold transition ${on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink hover:bg-surface-2'}`}
    >
      {children}
    </button>
  );
}

function statusOf(d: Departure): { word: string; tone: string } {
  if (d.lockedPlans > 0 && d.openPlans === 0) return { word: `${d.lockedPlans} locked`, tone: 'text-go' };
  if (d.openPlans > 0) return { word: `${d.openPlans} ${d.openPlans === 1 ? 'plan' : 'plans'} open`, tone: 'text-ink' };
  return { word: 'Gathering', tone: 'text-muted' };
}

function Board({ me }: { me: Me }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [rows, setRows] = useState<Departure[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dir = params.get('dir') === 'out' || params.get('dir') === 'back' ? params.get('dir')! : 'all';
  const dest = DESTS.includes(params.get('d') as DestKey) ? (params.get('d') as DestKey) : 'all';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '') ? params.get('date')! : 'all';

  const set = useCallback(
    (k: string, v: string) => {
      const next = new URLSearchParams(params.toString());
      if (v === 'all') next.delete(k);
      else next.set(k, v);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const load = useCallback(() => {
    setError(null);
    api
      .get<{ departures: Departure[] }>('/api/departures')
      .then((r) => setRows(r.departures))
      .catch((e) => setError(errorText(e)));
  }, []);
  useEffect(load, [load]);

  const today = useMemo(istToday, []);
  const days = useMemo(() => [...new Set((rows ?? []).map((r) => r.date))].slice(0, 10), [rows]);
  const shown = (rows ?? []).filter((r) => (dir === 'all' || r.direction === dir) && (dest === 'all' || r.destination === dest) && (date === 'all' || r.date === date));
  const groups = shown.reduce<Record<string, Departure[]>>((acc, r) => ((acc[r.date] ??= []).push(r), acc), {});
  const filtered = dir !== 'all' || dest !== 'all' || date !== 'all';

  return (
    <>
      {me.isDemo && (
        <p className="mb-4 rounded-[14px] border border-line bg-surface-2 px-4 py-3 text-sm">
          You’re in the demo, so these real rooms are view-only.{' '}
          <Link href="/signin?next=/departures" className="font-bold underline underline-offset-2">Sign in with KGP Google</Link> to join one.
        </p>
      )}

      <div className="mb-5 flex flex-col gap-2" role="group" aria-label="Filter departures">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
          <FilterChip on={dir === 'all'} onClick={() => set('dir', 'all')}>Both ways</FilterChip>
          <FilterChip on={dir === 'out'} onClick={() => set('dir', 'out')}>Leaving KGP</FilterChip>
          <FilterChip on={dir === 'back'} onClick={() => set('dir', 'back')}>Coming back</FilterChip>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
          <FilterChip on={dest === 'all'} onClick={() => set('d', 'all')}>All stations</FilterChip>
          {DESTS.map((k) => (
            <FilterChip key={k} on={dest === k} onClick={() => set('d', k)}>{DESTINATIONS[k].short}</FilterChip>
          ))}
        </div>
        {days.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
            <FilterChip on={date === 'all'} onClick={() => set('date', 'all')}>Any day</FilterChip>
            {days.map((d) => (
              <FilterChip key={d} on={date === d} onClick={() => set('date', d)}>{d === today ? 'Today' : formatTripDate(d)}</FilterChip>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorNote>The board didn’t load. {error}</ErrorNote>
          <Button variant="ghost" onClick={load}>Try again</Button>
        </div>
      ) : !rows ? (
        <Skeleton rows={4} />
      ) : shown.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-line p-5">
          <p className="font-bold">{filtered ? 'No rooms match these filters.' : 'No one has posted a trip yet.'}</p>
          <p className="mt-1 text-sm text-muted">
            {filtered ? 'Try another day or station, or post your trip and others will find you.' : 'Post yours and you’ll be first in the room. Everyone who posts the same day and station joins you.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {filtered && <Button variant="ghost" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</Button>}
            {!me.isDemo && (
              <Link
                href={`/new?${new URLSearchParams({ ...(dest !== 'all' ? { d: dest } : {}), ...(dir === 'back' ? { dir: 'back' } : {}), ...(date !== 'all' ? { date } : {}) })}`}
                className="brass grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm"
              >
                Post a trip
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted num" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'room' : 'rooms'}, {shown.reduce((n, r) => n + r.going, 0)} people
          </p>
          {Object.entries(groups).map(([day, list]) => (
            <section key={day} aria-labelledby={`d-${day}`} className="mb-6">
              <h2 id={`d-${day}`} className="mb-2 font-display text-[22px] font-semibold">
                {day === today ? `Today, ${formatTripDate(day)}` : formatTripDate(day)}
              </h2>
              <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
                <div className="hidden grid-cols-[5.5rem_1fr_5rem_8rem_6.5rem] gap-3 border-b border-line px-4 py-2 text-xs font-bold text-muted md:grid" aria-hidden>
                  <span>First plan</span>
                  <span>Route</span>
                  <span>Going</span>
                  <span>Status</span>
                  <span />
                </div>
                <ul className="divide-y divide-line">
                  {list.map((r) => {
                    const st = statusOf(r);
                    const place = DESTINATIONS[r.destination].label;
                    const route = r.direction === 'back' ? `${place} to KGP` : `KGP to ${place}`;
                    const href = me.isDemo
                      ? '/signin?next=/departures'
                      : r.mine
                        ? `/l/${r.lobbyId}`
                        : `/new?${new URLSearchParams({ d: r.destination, date: r.date, ...(r.direction === 'back' ? { dir: 'back' } : {}) })}`;
                    const verb = me.isDemo ? 'Sign in' : r.mine ? 'Open room' : 'Join';
                    return (
                      <li key={r.lobbyId}>
                        <Link
                          href={href}
                          aria-label={`${route}, ${formatTripDate(r.date)}: ${r.going} going, ${st.word}. ${verb}.`}
                          className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-surface-2 md:grid-cols-[5.5rem_1fr_5rem_8rem_6.5rem]"
                        >
                          <span className="leading-none">
                            {r.firstDepartAt ? (
                              <>
                                <span className="block font-display text-[26px] font-semibold num">{formatTime(r.firstDepartAt).split(' ')[0]}</span>
                                <span className="mt-0.5 block text-xs font-bold text-muted">{formatTime(r.firstDepartAt).split(' ')[1]}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-muted">No plan yet</span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-bold leading-snug">{route}</span>
                            <span className="text-sm text-muted md:hidden num">
                              {r.going} going, <span className={st.tone}>{st.word.toLowerCase()}</span>
                            </span>
                          </span>
                          <span className="hidden num md:block">{r.going}</span>
                          <span className={`hidden text-sm font-bold md:block ${st.tone}`}>{st.word}</span>
                          <span className={`justify-self-end rounded-full px-3 py-1.5 text-sm font-bold ${r.mine && !me.isDemo ? 'bg-go text-on-go' : 'border border-line'}`}>{verb}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
          <p className="text-sm text-muted">Names stay inside each room. Post your trip to see who’s going and the plans on the table.</p>
        </>
      )}
    </>
  );
}

export default function DeparturesPage() {
  return (
    <AppShell title="Departures" subtitle="Who from KGP is travelling, by day and station.">
      <AuthGate>{(me) => <Suspense fallback={<Skeleton rows={4} />}><Board me={me} /></Suspense>}</AuthGate>
    </AppShell>
  );
}
