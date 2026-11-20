'use client';
import { ProposalCard } from '@/components/cards';
import type { ProposalMeta } from '@/domain/cards';
import { SAMPLE_PROPOSAL, sampleMeta } from './samples';

const noop = () => {};

/** A read-only sample plan card for the website. */
export function PlanPreview({ inCount, status = 'open' }: { inCount: number; status?: ProposalMeta['status'] }) {
  return <ProposalCard proposal={SAMPLE_PROPOSAL} meta={sampleMeta(inCount, status)} me="" preview onJoin={noop} onLeave={noop} onLock={noop} onShare={noop} onOpenPod={noop} />;
}
