import { Suspense } from 'react';
import { getDb } from '@/server/db';
import { computeStats } from '@/server/stats';
import { formatINR } from '@/domain/fare';
import { Container, PageIntro, SitePage } from '@/components/PublicChrome';

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
    <SitePage current="/stats">
      <PageIntro
        title="Hop at IIT Kharagpur"
        lead="Live numbers from real students, recomputed every minute. Demo guests and test accounts are left out, so these are smaller and truer than the App Key’s user count."
      />
      <Container>
        <Suspense fallback={<p className="text-muted">Loading the numbers…</p>}>
          <Stats />
        </Suspense>
      </Container>

      <section aria-labelledby="beyond" className="mt-20 border-t border-line pt-16">
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="beyond" className="font-display text-[34px] font-semibold leading-tight md:text-[40px]">Beyond KGP</h2>
            <p className="mt-3 text-lg text-muted">Where Hop could go next. <strong className="text-ink">This is a plan, not a result.</strong> None of it is built yet.</p>
          </div>
          <dl className="divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
            {[
              ['Every residential campus has the same exodus', 'Semester ends, festivals and long weekends empty a campus towards the same few stations and airports. A campus is just a list of stations and halls in Hop’s catalogue.'],
              ['It grows through the trips themselves', 'Every plan has a share link that opens a counts-only page and leads straight into posting. Each locked trip pulls in the 2 or 3 people still looking, and return trips for January are posted in the same place.'],
              ['It costs very little to run', 'Rooms and trips are Nexconn group channels, and our Nexconn plan includes 10,000 monthly active users. The server and database run on free hosting tiers today.'],
              ['Ways it could pay for itself', 'Fixed-fare listings from campus cab agencies, sponsored station shuttles on peak days, or licensing to institutes and companies for shuttle coordination. Ideas only; we would test them with students first.'],
            ].map(([k, v]) => (
              <div key={k} className="py-5">
                <dt className="text-lg font-bold">{k}</dt>
                <dd className="mt-1 text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </SitePage>
  );
}
