export class ApiError extends Error {
  constructor(public status: number, public error: string) {
    super(error);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'error');
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  send: <T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) => request<T>(method, path, body),
};

const MESSAGES: Record<string, string> = {
  full: 'That plan is full. Pick another or propose your own.',
  busy: "You're already locked into a trip in this lobby.",
  too_few: 'Two people need to be in before you can lock.',
  departed: 'This trip has already left.',
  closed: 'This plan was cancelled.',
  not_in_lobby: 'Post your trip in this lobby first.',
  not_voter: 'Tap I’m in first, then you can lock.',
  slow_down: 'Too many taps. Wait a minute and try again.',
  not_live: 'This trip has ended.',
  profile_required: 'Add your hall and phone first.',
  date_out_of_range: 'Pick a date from today until 31 Jan.',
  bad_time: 'Pick a time on the trip day that is still ahead.',
  bad_request: 'Check the details and try again.',
  bad_phone: 'Enter a 10-digit Indian mobile number.',
  unauthorized: 'Sign in to continue.',
};

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return MESSAGES[e.error] ?? 'Something went wrong. Try again.';
  return 'Could not reach Hop. Check your connection.';
}
