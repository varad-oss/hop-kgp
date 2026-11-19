import { expect, test } from 'vitest';
import { fitBadge } from '@/domain/fit';

test('sedan: up to 3 bags fits, 4 is tight, 5 needs an SUV', () => {
  expect(fitBadge(3, 'sedan').kind).toBe('fits');
  expect(fitBadge(4, 'sedan').kind).toBe('tight');
  expect(fitBadge(5, 'sedan')).toEqual({ kind: 'needs_suv', label: 'Needs SUV' });
});

test('suv: 5 fits, 6 is tight, 7 is too many', () => {
  expect(fitBadge(5, 'suv').kind).toBe('fits');
  expect(fitBadge(6, 'suv').kind).toBe('tight');
  expect(fitBadge(7, 'suv')).toEqual({ kind: 'too_many', label: 'Too many bags' });
});
