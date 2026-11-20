import Link from 'next/link';
import type { Departure } from '@/server/overview';
import { DESTINATIONS } from '@/domain/catalog';
import { formatTime, formatTripDate } from '@/domain/copy';

const SAMPLE_ROWS: Departure[] = [
  { lobbyId: 's1', destination: 'HWH', direction: 'out', date: '2026-11-25', going: 6, openPlans: 1, lockedPlans: 1, firstDepartAt: '2026-11-25T01:00:00Z', mine: false },
  { lobbyId: 's2', destination: 'CCU', direction: 'out', date: '2026-11-25', going: 4, openPlans: 2, lockedPlans: 0, firstDepartAt: '2026-11-25T04:30:00Z', mine: false },
  { lobbyId: 's3', destination: 'SRC', direction: 'out', date: '2026-11-26', going: 2, openPlans: 0, lockedPlans: 0, firstDepartAt: null, mine: false },
  { lobbyId: 's4', destination: 'KGP', direction: 'out', date: '2026-11-27', going: 3, openPlans: 1, lockedPlans: 0, firstDepartAt: '2026-11-27T10:30:00Z', mine: false },
];

function status(d: Departure): string {
  if (d.lockedPlans > 0) return d.openPlans > 0 ? `${d.lockedPlans} locked, ${d.openPlans} open` : `${d.lockedPlans} locked`;
  if (d.openPlans > 0) return `${d.openPlans} ${d.openPlans === 1 ? 'plan' : 'plans'} open`;
  return 'Gathering';
}

/** A departures board. Real rooms (counts only) when there are any; labelled sample rows otherwise. */
export function Board({ rows }: { rows: Departure[] | null }) {
  const real = !!rows && rows.length > 0;
  const shown = (real ? rows! : SAMPLE_ROWS).slice(0, 5);
  return (
    <section aria-label={real ? 'Live departures from KGP' : 'Sample departures board'} className="lacquer lacquer-frame overflow-hidden rounded-[22px] text-on-ticket shadow-md">
      <header className="flex items-center justify-between gap-3 border-b border-ticket-line px-5 py-3">
        <p className="font-display text-xl font-semibold italic">Departures from KGP</p>
        <span className="flex items-center gap-2 text-xs font-bold text-on-ticket/80">
          <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${real ? 'bg-go pulse' : 'bg-on-ticket/40'}`} />
          {real ? 'Live rooms, counts only' : 'Sample'}
        </span>
      </header>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-on-ticket/70">
          <tr>
            <th scope="col" className="px-5 py-2 font-bold">Day</th>
            <th scope="col" className="py-2 font-bold">Route</th>
            <th scope="col" className="py-2 font-bold">First plan</th>
            <th scope="col" className="py-2 pr-5 text-right font-bold">Going</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ticket-line">
          {shown.map((d) => (
            <tr key={d.lobbyId}>
              <td className="whitespace-nowrap px-5 py-2.5 font-bold num">{formatTripDate(d.date)}</td>
              <td className="py-2.5">
                <span className="block font-bold">{d.direction === 'back' ? `${DESTINATIONS[d.destination].short} → KGP` : `KGP → ${DESTINATIONS[d.destination].short}`}</span>
                <span className="text-xs text-on-ticket/70">{status(d)}</span>
              </td>
              <td className="py-2.5 font-display text-lg num">{d.firstDepartAt ? formatTime(d.firstDepartAt) : <span className="font-sans text-xs text-on-ticket/70">None yet</span>}</td>
              <td className="py-2.5 pr-5 text-right font-display text-2xl num">{d.going}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="border-t border-ticket-line px-5 py-2.5 text-xs text-on-ticket/75">
        {real ? (
          <>Real rooms posted by KGP students. Names stay inside each room. <Link href="/departures" className="font-bold underline underline-offset-2">Open the full board</Link></>
        ) : (
          'Sample rows. When students post trips, this board shows real rooms with counts only.'
        )}
      </footer>
    </section>
  );
}
