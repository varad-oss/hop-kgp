const PHONE_RE = /(?<!\d)(?:\+?91[\s.-]?|0)?[6-9](?:[\s.-]?\d){9}(?!\d)/;

export function containsPhone(text: string): boolean {
  return PHONE_RE.test(text);
}

export function normalizeIndianMobile(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}
