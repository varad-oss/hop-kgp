import type { DestKey, Direction } from '@/domain/catalog';

export type TripStage = 'locked' | 'lock_ready' | 'waiting' | 'pick_plan' | 'no_plans' | 'ended';
export type TripOverview = {
  lobbyId: string;
  title: string;
  destination: DestKey;
  direction: Direction;
  date: string;
  going: number;
  openPlans: number;
  past: boolean;
  stage: TripStage;
  myPlan: { proposalId: string; inCount: number; seats: number; departAt: string; meetingPoint: string } | null;
  trip: { podId: string; status: 'pending' | 'live' | 'archived'; departAt: string; meetingPoint: string; people: number; each: number } | null;
};
export type Departure = {
  lobbyId: string;
  destination: DestKey;
  direction: Direction;
  date: string;
  going: number;
  openPlans: number;
  lockedPlans: number;
  firstDepartAt: string | null;
  mine: boolean;
};

export function istToday(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
