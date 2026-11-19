import { describe, expect, test } from 'vitest';
import { fareLine, formatINR, splitFare } from '@/domain/fare';

describe('splitFare', () => {
  test('rounds each share up and reports the remainder', () => {
    expect(splitFare(2800, 3)).toEqual({ each: 934, over: 2 });
    expect(splitFare(2800, 4)).toEqual({ each: 700, over: 0 });
    expect(splitFare(250, 4)).toEqual({ each: 63, over: 2 });
  });
  test('rejects a non-positive member count', () => {
    expect(() => splitFare(2800, 0)).toThrow(RangeError);
  });
});

describe('formatINR', () => {
  test('uses en-IN grouping', () => {
    expect(formatINR(2800)).toBe('₹2,800');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });
});

describe('fareLine', () => {
  test('shows the price now and the price with one more person', () => {
    expect(fareLine({ totalFare: 2800, inCount: 3, seats: 4 })).toBe('3 in · ₹934 each · 1 seat left → ₹700 each');
    expect(fareLine({ totalFare: 2800, inCount: 2, seats: 4 })).toBe('2 in · ₹1,400 each · 2 seats left → ₹934 each');
  });
  test('handles empty and full', () => {
    expect(fareLine({ totalFare: 2800, inCount: 0, seats: 4 })).toBe('Be the first · ₹700 each when full');
    expect(fareLine({ totalFare: 2800, inCount: 4, seats: 4 })).toBe('Full · ₹700 each');
  });
});
