import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PeekActions } from '@/components/PeekActions';
import { getDb } from '@/server/db';
import { peek } from '@/server/peek';

export async function generateMetadata({ params }: PageProps<'/p/[proposalId]'>): Promise<Metadata> {
  const { proposalId } = await params;
  const p = await peek(getDb(), proposalId).catch(() => null);
  return p ? { title: p.line, description: 'Join this plan on Hop.', openGraph: { title: p.line, description: 'Split the ride home with KGP on Hop.' } } : { title: 'Trip not available' };
}

async function Peek({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const p = await peek(getDb(), proposalId).catch(() => null);
  if (!p)
    return (
      <div className="flex flex-col items-start gap-4 p-5">
        <h1 className="font-display text-4xl font-semibold">This trip isn’t available</h1>
        <p className="text-muted">It may have left or been cancelled. Post your own and others can join.</p>
        <Link href="/new" className="grid min-h-12 place-items-center brass shadow-sm rounded-full px-6 font-bold">Post your trip</Link>
      </div>
    );
  const next = `/new?d=${p.destination}&date=${p.date}&then=join:${proposalId}`;
  const [head, ...rest] = p.line.split(' · ');
  return (
    <div className="flex flex-col gap-5 p-5">
      <p className="font-display text-2xl font-semibold">Hop</p>
      <section className="lacquer lacquer-frame rounded-[22px] p-5 text-on-ticket shadow-md" aria-label="Plan summary">
        <p className="font-display text-5xl font-semibold leading-none num">{p.time}</p>
        <p className="mt-2 text-lg">{rest[rest.length - 1]}</p>
        <p className="mt-4 font-display text-3xl font-semibold num">{head}</p>
        <p className="text-on-ticket/80 num">{rest.slice(0, -1).join(', ')}</p>
      </section>
      <PeekActions next={next} />
    </div>
  );
}

export default function PeekPage(props: PageProps<'/p/[proposalId]'>) {
  return (
    <main className="mx-auto w-full max-w-md flex-1">
      <Suspense fallback={<div className="p-8 text-muted">Loading the plan…</div>}>
        <Peek params={props.params} />
      </Suspense>
    </main>
  );
}
