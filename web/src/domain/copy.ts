import { WINDOWS, WINDOW_KEYS, type WindowKey } from './catalog';

export function summaryLine(s: { going: number; windows: Partial<Record<WindowKey, number>>; openProposals: number }): string {
  const parts = [`${s.going} going`];
  let best: WindowKey | null = null;
  for (const k of WINDOW_KEYS) {
    const c = s.windows[k] ?? 0;
    if (c > 0 && (best === null || c > (s.windows[best] ?? 0))) best = k;
  }
  if (best) parts.push(`${WINDOWS[best]}: ${s.windows[best]}`);
  parts.push(s.openProposals === 0 ? 'no proposals yet' : `${s.openProposals} open proposal${s.openProposals === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

const IST_MS = 5.5 * 3600 * 1000;

export function formatTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + IST_MS);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTripDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
