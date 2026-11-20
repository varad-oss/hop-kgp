function text(v: string): string {
  return v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[\\;,]/g, (c) => `\\${c}`);
}

function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function ticketIcs(t: { podId: string; departAt: string; destinationLabel: string; meetingPoint: string }): string {
  const end = new Date(new Date(t.departAt).getTime() + 3600_000).toISOString();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hop//KGP//EN',
    'BEGIN:VEVENT',
    `UID:${t.podId}@hop`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(t.departAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Hop trip to ${text(t.destinationLabel)}`,
    `LOCATION:${text(t.meetingPoint)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
