import { describe, expect, test } from 'vitest';
import { formatTime, formatTripDate, summaryLine } from '@/domain/copy';
import { ticketIcs } from '@/domain/ics';
import { parseProposalMeta } from '@/domain/cards';

describe('summaryLine', () => {
  test('names the busiest window and pluralizes proposals', () => {
    expect(summaryLine({ going: 14, windows: { w1: 5, w2: 3 }, openProposals: 2 })).toBe('14 going · 6–9 AM: 5 · 2 open proposals');
    expect(summaryLine({ going: 1, windows: { w0: 1 }, openProposals: 0 })).toBe('1 going · Before 6 AM: 1 · no proposals yet');
    expect(summaryLine({ going: 2, windows: { w2: 1, w3: 1 }, openProposals: 1 })).toBe('2 going · 9 AM–12: 1 · 1 open proposal');
  });
});

describe('date and time formatting', () => {
  test('IST time', () => {
    expect(formatTime('2026-11-26T01:00:00Z')).toBe('6:30 AM');
    expect(formatTime('2026-11-26T14:00:00Z')).toBe('7:30 PM');
  });
  test('trip date', () => {
    expect(formatTripDate('2026-11-26')).toBe('Thu 26 Nov');
  });
});

describe('ticketIcs', () => {
  test('contains start time, location and uid', () => {
    const ics = ticketIcs({ podId: 'p1', departAt: '2026-11-26T01:00:00Z', destinationLabel: 'Howrah Station', meetingPoint: 'Main Building gate' });
    expect(ics).toContain('DTSTART:20261126T010000Z');
    expect(ics).toContain('LOCATION:Main Building gate');
    expect(ics).toContain('UID:p1@hop');
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
  });
});

describe('ticketIcs hardening', () => {
  test('control characters cannot inject extra calendar properties; commas and semicolons are escaped', () => {
    const ics = ticketIcs({ podId: 'p1', departAt: '2026-11-26T01:00:00Z', destinationLabel: 'Howrah', meetingPoint: 'Gate\r\nURL:http://evil.example;x,y' });
    expect(ics.split('\r\n').some((l) => l.startsWith('URL:'))).toBe(false);
    expect(ics).toContain('LOCATION:GateURL:http://evil.example\\;x\\,y');
  });
});

describe('parseProposalMeta', () => {
  test('parses metadata strings', () => {
    expect(parseProposalMeta({ status: 'open', inCount: '3', bags: '4', voters: 'ua,ub,uc' })).toEqual({
      status: 'open', inCount: 3, bags: 4, voters: ['ua', 'ub', 'uc'], podId: null,
    });
    expect(parseProposalMeta({ status: 'locked', inCount: '2', bags: '1', voters: '', podId: 'pabc' }).voters).toEqual([]);
    expect(parseProposalMeta({}).status).toBe('open');
  });
});
