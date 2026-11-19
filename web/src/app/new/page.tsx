'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { api, errorText } from '@/client/api';
import { doneIntentSent, markLinkOpen } from '@/client/funnel';
import { AuthGate } from '@/components/AuthGate';
import { Button, Chip, ErrorNote, Field, inputClass, Shell, TopBar } from '@/components/ui';
import { DESTINATIONS, MAX_TRIP_DATE, WINDOWS, WINDOW_KEYS, type DestKey, type Direction, type WindowKey } from '@/domain/catalog';
import { formatTripDate } from '@/domain/copy';
import { useEffect } from 'react';

function istToday(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function Form() {
  const params = useSearchParams();
  const router = useRouter();
  const today = useMemo(istToday, []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const initialDest = params.get('d') as DestKey | null;
  const [dest, setDest] = useState<DestKey | null>(initialDest && initialDest in DESTINATIONS ? initialDest : null);
  const [direction, setDirection] = useState<Direction>(params.get('dir') === 'back' ? 'back' : 'out');
  const [date, setDate] = useState<string>(params.get('date') ?? days[0]);
  const [window, setWindow] = useState<WindowKey | null>(null);
  const [bags, setBags] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(markLinkOpen, []);

  const ready = dest && window && date;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { lobbyId } = await api.send<{ lobbyId: string }>('POST', '/api/intents', { destination: dest, direction, date, window, bags });
      void doneIntentSent();
      const then = params.get('then');
      router.push(`/l/${lobbyId}${then?.startsWith('join:') ? `?join=${encodeURIComponent(then.slice(5))}` : ''}`);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6 p-4 pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Direction</legend>
        <div className="flex gap-2">
          <Chip active={direction === 'out'} onClick={() => setDirection('out')}>Leaving campus</Chip>
          <Chip active={direction === 'back'} onClick={() => setDirection('back')}>Coming back to KGP</Chip>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{direction === 'out' ? 'Where are you going?' : 'Where are you coming from?'}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(DESTINATIONS) as DestKey[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={dest === k}
              onClick={() => setDest(k)}
              className={`min-h-16 rounded-2xl border px-3 py-2 text-left transition ${dest === k ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:bg-surface-2'}`}
            >
              <span className="block font-display text-2xl font-semibold leading-tight">{DESTINATIONS[k].short}</span>
              <span className={`text-sm ${dest === k ? 'text-bg/80' : 'text-muted'}`}>{DESTINATIONS[k].label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Which day?</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Chip key={d} active={date === d} onClick={() => setDate(d)}>{d === today ? 'Today' : formatTripDate(d)}</Chip>
          ))}
        </div>
        <Field label="Another date" hint="Any day until 31 Jan, so you can post your return trip too.">
          <input type="date" className={inputClass} min={today} max={MAX_TRIP_DATE} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">When can you leave?</legend>
        <div className="flex flex-wrap gap-2">
          {WINDOW_KEYS.map((k) => (
            <Chip key={k} active={window === k} onClick={() => setWindow(k)}>{WINDOWS[k]}</Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <span id="bags" className="text-sm font-bold">Large bags</span>
        <div className="flex items-center gap-3" role="group" aria-labelledby="bags">
          <button type="button" aria-label="Fewer bags" onClick={() => setBags((b) => Math.max(0, b - 1))} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-xl">−</button>
          <span className="w-6 text-center font-display text-3xl font-semibold num" aria-live="polite">{bags}</span>
          <button type="button" aria-label="More bags" onClick={() => setBags((b) => Math.min(6, b + 1))} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-xl">+</button>
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button type="submit" variant="signal" busy={busy} disabled={!ready} className="min-h-12 w-full text-base">
            Find co-travellers
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function NewTrip() {
  return (
    <Shell>
      <TopBar back="/home" title={<span className="font-display text-2xl font-semibold">Post your trip</span>} />
      <AuthGate>{() => <Suspense fallback={null}><Form /></Suspense>}</AuthGate>
    </Shell>
  );
}
