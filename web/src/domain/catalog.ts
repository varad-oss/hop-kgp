export type DestKey = 'CCU' | 'HWH' | 'SRC' | 'KGP';
export type VehicleKey = 'toto' | 'sedan' | 'suv';
export type WindowKey = 'w0' | 'w1' | 'w2' | 'w3' | 'w4' | 'w5';
export type Direction = 'out' | 'back';

export const DESTINATIONS: Record<DestKey, { label: string; short: string }> = {
  CCU: { label: 'Kolkata Airport (CCU)', short: 'CCU' },
  HWH: { label: 'Howrah Station', short: 'Howrah' },
  SRC: { label: 'Santragachi', short: 'Santragachi' },
  KGP: { label: 'Kharagpur Station', short: 'KGP Station' },
};

// CHECK with the user: local capacities. bagCap = large bags that fit comfortably.
export const VEHICLES: Record<VehicleKey, { seats: number; bagCap: number; label: string }> = {
  toto: { seats: 4, bagCap: 4, label: 'Toto' },
  sedan: { seats: 4, bagCap: 3, label: 'Sedan' },
  suv: { seats: 6, bagCap: 5, label: 'SUV' },
};

// CHECK with the user: ₹250 toto (freshers guide ₹250–300), ₹2,800 CCU sedan (campus agency fixed non-AC fare).
export const FARE_PRESETS: Record<string, number> = { 'KGP:toto': 250, 'CCU:sedan': 2800 };

export const WINDOWS: Record<WindowKey, string> = {
  w0: 'Before 6 AM',
  w1: '6–9 AM',
  w2: '9 AM–12',
  w3: '12–4 PM',
  w4: '4–8 PM',
  w5: 'After 8 PM',
};
export const WINDOW_KEYS = Object.keys(WINDOWS) as WindowKey[];

export const MEETING_POINTS = ['Main Building gate', 'Tech Market gate', 'Gate 1 (Hijli)', 'Azad Hall gate', 'Nehru Hall gate', 'Kharagpur Station'];
export const HALLS = ['Azad', 'Nehru', 'Patel', 'RP', 'RK', 'LBS', 'LLR', 'MMM', 'MS', 'SN/IG', 'VS', 'JCB', 'BC Roy', 'Gokhale', 'SNVH', 'Rani Laxmibai'];

export const MAX_TRIP_DATE = '2027-01-31';
