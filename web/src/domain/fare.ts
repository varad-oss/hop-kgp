export function splitFare(total: number, members: number): { each: number; over: number } {
  if (!Number.isInteger(members) || members < 1) throw new RangeError('members must be a positive integer');
  const each = Math.ceil(total / members);
  return { each, over: each * members - total };
}

export function formatINR(n: number): string {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

export function fareLine(p: { totalFare: number; inCount: number; seats: number }): string {
  const { totalFare, inCount, seats } = p;
  if (inCount <= 0) return `Be the first · ${formatINR(splitFare(totalFare, seats).each)} each when full`;
  if (inCount >= seats) return `Full · ${formatINR(splitFare(totalFare, seats).each)} each`;
  const free = seats - inCount;
  return `${inCount} in · ${formatINR(splitFare(totalFare, inCount).each)} each · ${free} seat${free === 1 ? '' : 's'} left → ${formatINR(
    splitFare(totalFare, inCount + 1).each,
  )} each`;
}
