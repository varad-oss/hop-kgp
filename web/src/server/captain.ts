import { DESTINATIONS, VEHICLES } from '@/domain/catalog';
import type { HopTicket } from '@/domain/cards';
import { formatTime, formatTripDate } from '@/domain/copy';
import { formatINR } from '@/domain/fare';
import type { UserRow } from './auth';
import type { Db } from './db';
import { HttpError } from './http';
import { botId, ensureBot } from './lobbies';
import type { NexconnApi } from './nexconn/api';
import { getPod } from './pods';
import { hitRateLimit } from './rateLimit';

export type ChatLine = { name: string; text: string };

function names(list: string[]): string {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

function seats(n: number): string {
  return n === 0 ? 'full' : `${n} seat${n === 1 ? '' : 's'} open`;
}

/** Facts only: no phone numbers ever go to the model. */
export function captainPrompt(t: HopTicket, recent: ChatLine[]): string {
  const dest = DESTINATIONS[t.destination].label;
  const facts = [
    `Trip: ${t.direction === 'back' ? `back to IIT Kharagpur from ${dest}` : `IIT Kharagpur to ${dest}`}`,
    `Leaves: ${formatTripDate(t.departAt.slice(0, 10))}, ${formatTime(t.departAt)} IST from ${t.meetingPoint}`,
    `Vehicle: ${VEHICLES[t.vehicle].label} for ${t.seats}, ${seats(t.freeSeats)}`,
    `Fare: ${formatINR(t.totalFare)} total, ${formatINR(t.each)} each`,
    `People: ${names(t.members.map((m) => m.name.replace(/^Demo · /, '')))}`,
  ];
  const chat = recent
    .slice(-30)
    .map((l) => `${l.name}: ${l.text.replace(/\s+/g, ' ').slice(0, 300)}`)
    .join('\n');
  return [
    'You are the trip captain for a group of IIT Kharagpur students sharing a ride. Be warm, brief and practical.',
    'Facts:',
    ...facts.map((f) => `- ${f}`),
    chat ? `Recent chat (newest last):\n${chat}` : 'The chat is empty so far.',
    'Summarize in ≤ 60 words: plan, who\'s in, open seats, anything unresolved (who books the cab, who is late, open questions). Plain sentences, no headings, no phone numbers.',
  ].join('\n');
}

/** The summary used when no model is configured or the model fails before saying anything. */
export function fallbackSummary(t: HopTicket): string {
  const dest = DESTINATIONS[t.destination].label;
  const people = names(t.members.map((m) => m.name.replace(/^Demo · /, '')));
  return (
    `${people} leave for ${dest} at ${formatTime(t.departAt)} on ${formatTripDate(t.departAt.slice(0, 10))}, from ${t.meetingPoint}. ` +
    `${VEHICLES[t.vehicle].label}, ${formatINR(t.each)} each, ${seats(t.freeSeats)}. ` +
    `Still to settle: who books the cab and shares its number here.`
  );
}

/** Sends chunks as one Nexconn stream message: seq 1..n, messageId from chunk 2, complete on the last.
 *  `onStart` fires with the message id as soon as the first chunk is accepted. */
export async function streamCaptain(
  nx: NexconnApi,
  to: { fromUserId: string; channelId: string },
  chunks: AsyncIterable<string>,
  onStart?: (messageId: string) => void,
): Promise<string> {
  let seq = 0;
  let messageId: string | undefined;
  let held: string | null = null;
  let full = '';
  const send = async (content: string, complete: boolean) => {
    seq += 1;
    const id = await nx.sendGroupStreamChunk({ ...to, content, seq, complete, messageId });
    if (!messageId) {
      messageId = id;
      onStart?.(id);
    }
  };
  for await (const c of chunks) {
    if (!c) continue;
    if (held !== null) await send(held, false);
    held = c;
    full += c;
  }
  if (held !== null) await send(held, true);
  return full;
}

async function* words(text: string): AsyncIterable<string> {
  const parts = text.match(/\S+\s*/g) ?? [];
  for (let i = 0; i < parts.length; i += 4) {
    yield parts.slice(i, i + 4).join('');
    await new Promise((r) => setTimeout(r, 60));
  }
}

/** Yields the model's chunks, but if it fails before any text, yields the fallback instead. */
async function* withFallback(primary: () => AsyncIterable<string>, fallback: string): AsyncIterable<string> {
  let said = false;
  try {
    for await (const c of primary()) {
      if (c) said = true;
      yield c;
    }
  } catch (e) {
    if (said) return;
    console.warn('captain: model failed, using fallback', e instanceof Error ? e.message : e);
  }
  if (!said) yield* words(fallback);
}

export type Generator = (prompt: string) => AsyncIterable<string>;

/** Starts the summary and resolves once its first chunk is out; `done` settles when the stream ends. */
export async function runCaptain(
  db: Db,
  nx: NexconnApi,
  user: UserRow,
  podId: string,
  recent: ChatLine[],
  generate: Generator,
): Promise<{ result: 'ok'; messageId: string | null; done: Promise<void> }> {
  const pod = await getPod(db, nx, user, podId);
  if (pod.status !== 'live') throw new HttpError(409, 'not_live');
  if (!(await hitRateLimit(db, `captain:${podId}`, 3, 3600))) throw new HttpError(429, 'slow_down');
  await ensureBot(nx);
  const t = pod.ticket;
  let started!: (id: string | null) => void;
  const first = new Promise<string | null>((r) => (started = r));
  const done = streamCaptain(
    nx,
    { fromUserId: botId(), channelId: pod.channelId },
    withFallback(() => generate(captainPrompt(t, recent)), fallbackSummary(t)),
    (id) => started(id),
  )
    .then(() => started(null))
    .catch((e) => {
      started(null);
      console.error('captain: stream failed', e);
    });
  return { result: 'ok', messageId: await first, done };
}

/** Gemini streaming over SSE, batched into ~30-character chunks so the stream stays smooth without flooding the API. */
export function geminiGenerator(apiKey: string | undefined, model = process.env.GEMINI_MODEL ?? 'gemini-flash-lite-latest'): Generator {
  return async function* (prompt: string) {
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok || !res.body) throw new Error(`gemini ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    let pending = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        try {
          const j = JSON.parse(line.slice(5));
          const text: string = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
          pending += text;
        } catch {
          /* partial or non-JSON line */
        }
        if (pending.length >= 30) {
          yield pending;
          pending = '';
        }
      }
    }
    if (pending) yield pending;
  };
}
