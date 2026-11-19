'use client';
import { useState } from 'react';
import { api, errorText } from '@/client/api';
import { Button, Chip, ErrorNote, Field, inputClass } from './ui';

export function FeedbackPrompt({ podId, onDone }: { podId: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await api.send('POST', '/api/feedback', { podId, rating, note });
      onDone();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <section className="mx-3 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4" aria-label="Two quick questions">
      <h2 className="font-display text-2xl font-semibold">Two quick questions</h2>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">How easy was finding co-travellers?</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip key={n} active={rating === n} onClick={() => setRating(n)} aria-label={`${n} out of 5`}>{n}</Chip>
          ))}
        </div>
        <p className="mt-1 text-sm text-muted">1 is hard, 5 is easy.</p>
      </fieldset>
      <Field label="What almost stopped you?">
        <input className={inputClass} value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex gap-2">
        <Button variant="signal" busy={busy} disabled={rating === 0} onClick={() => void send()}>Send</Button>
        <Button variant="ghost" onClick={onDone}>Skip</Button>
      </div>
    </section>
  );
}

export function ReturnTripPrompt({ destination }: { destination: string }) {
  return (
    <section className="mx-3 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
      <p className="font-bold">Coming back 1–3 Jan?</p>
      <a href={`/new?dir=back&d=${destination}&date=2027-01-02`} className="grid min-h-11 place-items-center rounded-xl bg-signal px-4 font-bold text-on-signal">
        Post your return trip
      </a>
    </section>
  );
}
