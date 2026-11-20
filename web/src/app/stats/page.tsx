import { Suspense } from 'react';
import { getDb } from '@/server/db';
import { computeStats } from '@/server/stats';
import { formatINR } from '@/domain/fare';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';

export const metadata = { title: 'Traction', description: 'Live numbers for Hop at IIT Kharagpur. Demo and test accounts excluded.' };

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="font-display text-5xl font-semibold leading-none num">{value}</p>
      <p className="mt-2 text-muted">{label}</p>
    </div>
  );
}

async function Stats() {
  const s = await computeStats(getDb());
  const max = Math.max(1, ...s.daily.flatMap((d) => [d.signups, d.locks]));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile value={String(s.students)} label="KGPians signed up" />
        <Tile value={String(s.tripsLocked)} label="Trips locked" />
        <Tile value={formatINR(s.rupeesSaved)} label="Saved vs riding alone" />
        <Tile value={String(s.returnTripsPosted)} label="Return trips posted for January" />
      </div>
      {s.medianLinkToIntentMs !== null && (
        <p className="num">
          Median time from opening a link to posting a trip: <strong>{Math.round(s.medianLinkToIntentMs / 1000)} seconds</strong>.
        </p>
      )}
      <section aria-labelledby="daily">
        <h2 id="daily" className="font-display text-2xl font-semibold">Each day</h2>
        {s.daily.length === 0 ? (
          <p className="mt-2 text-muted">No activity yet.</p>
        ) : (
          <>
            <p className="mt-1 flex gap-4 text-sm text-muted">
              <span><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-ink align-middle" />Signups</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-go align-middle" />Trips locked</span>
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {s.daily.map((d) => (
                <li key={d.date} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 num">
                  <span className="text-sm text-muted">{d.date.slice(5)}</span>
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2"><span className="h-3 rounded-sm bg-ink" style={{ width: `${(d.signups / max) * 100}%`, minWidth: d.signups ? 4 : 0 }} /><span className="text-sm">{d.signups}</span></span>
                    <span className="flex items-center gap-2"><span className="h-3 rounded-sm bg-go" style={{ width: `${(d.locks / max) * 100}%`, minWidth: d.locks ? 4 : 0 }} /><span className="text-sm">{d.locks}</span></span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <p className="text-sm text-muted">Demo and test accounts are excluded. Updated every minute.</p>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 md:px-6">
        <h1 className="font-display text-[40px] font-semibold leading-tight">Hop at IIT Kharagpur</h1>
        <p className="mb-6 mt-2 text-lg text-muted">Live numbers from real students. Demo and test accounts are left out.</p>
        <Suspense fallback={<p className="text-muted">Loading the numbers…</p>}>
          <Stats />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
