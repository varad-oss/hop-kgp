import type { DestKey, Direction, VehicleKey, WindowKey } from './catalog';

export const CARD_INTENT = 'Hop:Intent';
export const CARD_PROPOSAL = 'Hop:Proposal';
export const CARD_TICKET = 'Hop:Ticket';

export type HopIntent = { intentId: string; nexconnId: string; name: string; hall: string | null; window: WindowKey; bags: number; isDemo: boolean };

export type HopProposal = {
  proposalId: string;
  lobbyId: string;
  creatorName: string;
  departAt: string;
  meetingPoint: string;
  vehicle: VehicleKey;
  totalFare: number;
  seats: number;
  isDemo: boolean;
};

export type TicketMember = { nexconnId: string; name: string; hall: string | null; phone: string };

export type HopTicket = {
  podId: string;
  proposalId: string;
  destination: DestKey;
  direction: Direction;
  departAt: string;
  meetingPoint: string;
  vehicle: VehicleKey;
  totalFare: number;
  each: number;
  over: number;
  seats: number;
  freeSeats: number;
  members: TicketMember[];
  reason?: { kind: 'joined' | 'left'; name: string };
  isDemo: boolean;
};

export type ProposalMeta = { status: 'open' | 'locked' | 'cancelled'; inCount: number; bags: number; voters: string[]; podId: string | null };

export function parseProposalMeta(m: Record<string, string>): ProposalMeta {
  const status = m.status === 'locked' || m.status === 'cancelled' ? m.status : 'open';
  return {
    status,
    inCount: parseInt(m.inCount ?? '0', 10) || 0,
    bags: parseInt(m.bags ?? '0', 10) || 0,
    voters: (m.voters ?? '').split(',').filter(Boolean),
    podId: m.podId || null,
  };
}
