import { VEHICLES, type VehicleKey } from './catalog';

export type Fit = { kind: 'fits' | 'tight' | 'needs_suv' | 'too_many'; label: string };

export function fitBadge(totalBags: number, vehicle: VehicleKey): Fit {
  const cap = VEHICLES[vehicle].bagCap;
  if (totalBags <= cap) return { kind: 'fits', label: 'Fits' };
  if (totalBags === cap + 1) return { kind: 'tight', label: 'Tight' };
  if (vehicle !== 'suv' && totalBags <= VEHICLES.suv.bagCap) return { kind: 'needs_suv', label: 'Needs SUV' };
  return { kind: 'too_many', label: 'Too many bags' };
}
