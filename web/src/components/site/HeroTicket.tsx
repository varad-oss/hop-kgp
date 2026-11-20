'use client';
import { useEffect, useState } from 'react';
import { TicketCard } from '@/components/cards';
import { sampleTicket } from './samples';

/** The hero's one moment: a third person joins and the fare re-splits from ₹1,400 to ₹934. */
export function HeroTicket() {
  const [people, setPeople] = useState<2 | 3>(2);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPeople(3);
      return;
    }
    setPeople(2);
    const t = setTimeout(() => setPeople(3), 1800);
    return () => clearTimeout(t);
  }, [run]);
  return (
    <figure className="m-0">
      <div key={people} className="pop">
        <TicketCard ticket={sampleTicket(people)} />
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-3 px-3 text-sm text-muted">
        <span aria-live="polite">
          Sample ticket. {people === 3 ? 'Riya joined, so everyone now pays ₹934.' : 'Two travelling, ₹1,400 each.'}
        </span>
        <button type="button" onClick={() => setRun((r) => r + 1)} className="min-h-10 shrink-0 rounded-full border border-line bg-surface px-3 font-bold text-ink hover:bg-surface-2">
          Replay
        </button>
      </figcaption>
    </figure>
  );
}
