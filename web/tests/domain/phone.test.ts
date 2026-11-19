import { describe, expect, test } from 'vitest';
import { containsPhone, normalizeIndianMobile } from '@/domain/phone';

describe('containsPhone', () => {
  test.each(['9876543210', '+91 98765 43210', '98765-43210', '098765 43210', '9 8 7 6 5 4 3 2 1 0', 'call me 91-9876543210'])(
    'blocks %s',
    (s) => expect(containsPhone(s)).toBe(true),
  );
  test.each(['leaving 6:30, 2 bags', '₹2,800 total', '26-11-2026', 'order 1234567890', '4 people 5 bags 600 each'])(
    'allows %s',
    (s) => expect(containsPhone(s)).toBe(false),
  );
});

describe('normalizeIndianMobile', () => {
  test('returns ten digits or null', () => {
    expect(normalizeIndianMobile('+91 98765-43210')).toBe('9876543210');
    expect(normalizeIndianMobile('098765 43210')).toBe('9876543210');
    expect(normalizeIndianMobile('12345')).toBeNull();
    expect(normalizeIndianMobile('5876543210')).toBeNull();
  });
});
