'use client';
import { ProposalCard, TicketCard, IntentCard, TextBubble } from '@/components/cards';
import type { HopProposal, HopTicket } from '@/domain/cards';

const proposal: HopProposal = { proposalId: 'p', lobbyId: 'l', creatorName: 'Riya', departAt: '2026-11-26T01:00:00Z', meetingPoint: 'Main Building gate', vehicle: 'sedan', totalFare: 2800, seats: 4, isDemo: false };
const noop = () => {};
const act = { onJoin: noop, onLeave: noop, onLock: noop, onShare: noop, onOpenPod: noop };
const ticket: HopTicket = { podId: 'x', proposalId: 'p', destination: 'HWH', direction: 'out', departAt: '2026-11-26T01:00:00Z', meetingPoint: 'Main Building gate', vehicle: 'sedan', totalFare: 2800, each: 934, over: 2, seats: 4, freeSeats: 1, isDemo: false, reason: { kind: 'joined', name: 'Ankit' },
  members: [{ nexconnId: 'a', name: 'Riya', hall: 'Azad', phone: '9876543210' }, { nexconnId: 'b', name: 'Ankit', hall: 'Nehru', phone: '9123456780' }, { nexconnId: 'c', name: 'Meera', hall: 'SN/IG', phone: '9988776655' }] };

export default function Gallery() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 py-4">
      <IntentCard intent={{ intentId: 'i', nexconnId: 'a', name: 'Riya', hall: 'Azad', window: 'w1', bags: 2, isDemo: false }} />
      <TextBubble text="Anyone leaving before 7?" mine={false} sender="Ankit" />
      <TextBubble text="Yes, I'm on the 6:30 plan" mine />
      <ProposalCard proposal={proposal} meta={{ status: 'open', inCount: 3, bags: 4, voters: ['a', 'b', 'c'], podId: null }} me="a" {...act} />
      <ProposalCard proposal={proposal} meta={{ status: 'open', inCount: 1, bags: 1, voters: ['b'], podId: null }} me="a" {...act} error="That plan is full. Pick another or propose your own." />
      <ProposalCard proposal={{ ...proposal, isDemo: true }} meta={{ status: 'locked', inCount: 3, bags: 3, voters: ['a', 'b', 'c'], podId: 'x' }} me="a" {...act} />
      <TicketCard ticket={ticket} me="a" onCalendar={noop} />
    </main>
  );
}
