import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PeekActions } from '@/components/PeekActions';
import { Container, SitePage } from '@/components/PublicChrome';
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
      <div className="flex max-w-xl flex-col items-start gap-4">
        <h1 className="font-display text-[44px] font-semibold leading-tight">This trip isn’t available</h1>
        <p className="text-muted">It may have left or been cancelled. Post your own and others can join.</p>
        <Link href="/new" className="grid min-h-12 place-items-center brass shadow-sm rounded-full px-6 font-bold">Post your trip</Link>
      </div>
    );
  const next = `/new?d=${p.destination}&date=${p.date}&then=join:${proposalId}`;
  const [head, ...rest] = p.line.split(' · ');
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
      <section className="lacquer lacquer-frame rounded-[22px] p-6 text-on-ticket shadow-md lg:col-span-6" aria-label="Plan summary">
        <p className="text-sm text-on-ticket/75">A plan on Hop</p>
        <p className="mt-2 font-display text-6xl font-semibold leading-none num">{p.time}</p>
        <p className="mt-2 text-lg">{rest[rest.length - 1]}</p>
        <p className="mt-5 font-display text-3xl font-semibold num">{head}</p>
        <p className="text-on-ticket/80 num">{rest.slice(0, -1).join(', ')}</p>
      </section>
      <div className="lg:col-span-5 lg:col-start-8">
        <h1 className="font-display text-[36px] font-semibold leading-tight md:text-[44px]">You’ve been sent a plan</h1>
        <p className="mt-3 text-lg text-muted">Post your trip for the same day and you’ll land in the room with this plan, ready to tap I’m in. Names and numbers stay inside the room.</p>
        <div className="mt-6">
          <PeekActions next={next} />
        </div>
      </div>
    </div>
  );
}

export default function PeekPage(props: PageProps<'/p/[proposalId]'>) {
  return (
    <SitePage>
      <Container className="pt-14 md:pt-20">
        <Suspense fallback={<p className="text-muted">Loading the plan…</p>}>
          <Peek params={props.params} />
        </Suspense>
      </Container>
    </SitePage>
  );
}
