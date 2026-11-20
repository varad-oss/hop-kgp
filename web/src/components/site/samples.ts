import type { HopIntent, HopProposal, HopTicket, ProposalMeta } from '@/domain/cards';

// Sample data for the website. Every place it appears is labelled "Sample".
export const SAMPLE_DEPART = '2026-11-25T01:00:00Z'; // 6:30 AM IST, Wed 25 Nov

export const SAMPLE_PROPOSAL: HopProposal = {
  proposalId: 'sample',
  lobbyId: 'sample',
  creatorName: 'Aarav',
  departAt: SAMPLE_DEPART,
  meetingPoint: 'Main Building gate',
  vehicle: 'sedan',
  totalFare: 2800,
  seats: 4,
  isDemo: false,
};

export const sampleMeta = (inCount: number, status: ProposalMeta['status'] = 'open'): ProposalMeta => ({
  status,
  inCount,
  bags: inCount + 1,
  voters: [],
  podId: null,
});

export const SAMPLE_INTENTS: HopIntent[] = [
  { intentId: 's1', nexconnId: 's1', name: 'Aarav', hall: 'Azad', window: 'w1', bags: 2, isDemo: false },
  { intentId: 's2', nexconnId: 's2', name: 'Meera', hall: 'SN/IG', window: 'w1', bags: 1, isDemo: false },
];

const member = (name: string, hall: string) => ({ nexconnId: name, name, hall, phone: 'Shown after lock' });

export function sampleTicket(people: 2 | 3): HopTicket {
  const members = [member('Aarav', 'Azad'), member('Meera', 'SN/IG'), ...(people === 3 ? [member('Riya', 'Nehru')] : [])];
  return {
    podId: 'sample',
    proposalId: 'sample',
    destination: 'HWH',
    direction: 'out',
    departAt: SAMPLE_DEPART,
    meetingPoint: 'Main Building gate',
    vehicle: 'sedan',
    totalFare: 2800,
    each: people === 3 ? 934 : 1400,
    over: people === 3 ? 2 : 0,
    seats: 4,
    freeSeats: 4 - people,
    isDemo: true,
    members,
    ...(people === 3 ? { reason: { kind: 'joined' as const, name: 'Riya' } } : {}),
  };
}
