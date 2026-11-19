const KEY = 'hop:link_open_at';

/** Start the link-open → intent-sent clock (first call wins). */
export function markLinkOpen() {
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** Stop the clock and report how long the journey took. */
export async function doneIntentSent() {
  let ms: number | undefined;
  try {
    const t0 = Number(localStorage.getItem(KEY));
    if (t0) ms = Date.now() - t0;
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'intent_sent', ms }),
  }).catch(() => {});
}
