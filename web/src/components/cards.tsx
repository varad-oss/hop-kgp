'use client';
import type { HopIntent, HopProposal, HopTicket, ProposalMeta } from '@/domain/cards';
import { DESTINATIONS, VEHICLES, WINDOWS } from '@/domain/catalog';
import { formatTime, formatTripDate } from '@/domain/copy';
import { formatINR, splitFare } from '@/domain/fare';
import { fitBadge } from '@/domain/fit';
import { Button } from './ui';

export function SeatDots({ filled, total }: { filled: number; total: number }) {
  return (
    <span role="img" aria-label={`${filled} of ${total} seats taken`} className="inline-flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-3 w-3 rounded-full border-2 ${i < filled ? 'border-ink bg-ink' : 'border-muted bg-transparent'}`} />
      ))}
    </span>
  );
}

export function DemoTag() {
  return <span className="brass rounded-full px-2 py-0.5 text-xs font-bold">Demo</span>;
}

export function IntentCard({ intent, mine }: { intent: HopIntent; mine?: boolean }) {
  return (
    <div className={`mx-3 flex items-center gap-3 rounded-2xl border border-line px-3 py-2 ${mine ? 'bg-surface-2' : 'bg-surface'}`}>
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-semibold text-bg">
        {intent.name.replace('Demo · ', '').charAt(0).toUpperCase()}
      </span>
      <p className="min-w-0 flex-1 text-[15px] leading-snug">
        <span className="font-bold">{intent.name}</span>
        {intent.hall ? <span className="text-muted"> from {intent.hall}</span> : null}
        <br />
        <span className="text-muted">
          leaving {WINDOWS[intent.window]}, {intent.bags} {intent.bags === 1 ? 'bag' : 'bags'}
        </span>
      </p>
      {intent.isDemo && <DemoTag />}
    </div>
  );
}

const FIT_STYLE = { fits: 'bg-go text-on-go', tight: 'brass', needs_suv: 'bg-stop text-bg', too_many: 'bg-stop text-bg' } as const;

export type ProposalActions = {
  onJoin: () => void;
  onLeave: () => void;
  onLock: () => void;
  onShare: () => void;
  onOpenPod: (podId: string) => void;
  busy?: boolean;
  error?: string | null;
};

/** A plan card. `preview` renders it read-only (no buttons) for the website. */
export function ProposalCard({ proposal, meta, me, preview, ...a }: { proposal: HopProposal; meta: ProposalMeta } & { me: string; preview?: boolean } & ProposalActions) {
  const { status, inCount, voters, bags, podId } = meta;
  const free = Math.max(0, proposal.seats - inCount);
  const mineIn = voters.includes(me);
  const now = formatTime(proposal.departAt).split(' ');
  const fit = fitBadge(bags, proposal.vehicle);
  const each = splitFare(proposal.totalFare, Math.max(1, inCount)).each;
  const next = free > 0 ? splitFare(proposal.totalFare, inCount + 1).each : null;
  const locked = status === 'locked';

  return (
    <article
      className={`mx-3 rounded-[22px] border bg-surface p-4 shadow-sm ${locked ? 'border-go' : 'border-line'} ${status === 'cancelled' ? 'opacity-60' : ''}`}
      aria-label={`Plan: ${now.join(' ')} from ${proposal.meetingPoint}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[44px] font-semibold leading-none num">
            {now[0]} <span className="text-xl text-muted">{now[1]}</span>
          </p>
          <p className="mt-1 font-bold">{proposal.meetingPoint}</p>
          <p className="text-sm text-muted">
            {VEHICLES[proposal.vehicle].label} for {proposal.seats}, proposed by {proposal.creatorName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {locked ? <span className="rounded-full bg-go px-2.5 py-0.5 text-sm font-bold text-on-go">Locked</span> : null}
          {inCount > 0 && !locked ? (
            <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${FIT_STYLE[fit.kind]}`} title={`${bags} bags in this plan`}>
              {fit.label}
            </span>
          ) : null}
          {proposal.isDemo ? <DemoTag /> : null}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="font-display text-3xl font-semibold leading-none num">
            {inCount > 0 ? formatINR(each) : formatINR(splitFare(proposal.totalFare, proposal.seats).each)}
            <span className="ml-1 text-base font-medium text-muted">{inCount > 0 ? 'each' : 'each when full'}</span>
          </p>
          <p className="mt-1 text-sm text-muted num">
            {free === 0 ? 'Full' : next ? `${free} seat${free === 1 ? '' : 's'} left, next person makes it ${formatINR(next)}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SeatDots filled={inCount} total={proposal.seats} />
          <span className="text-sm text-muted num">{inCount} in</span>
        </div>
      </div>

      {a.error ? (
        <p role="alert" className="mt-3 text-sm font-bold text-stop">
          {a.error}
        </p>
      ) : null}

      {status !== 'cancelled' && !preview && (
        <div className="mt-3 flex flex-wrap gap-2">
          {locked ? (
            mineIn && podId ? (
              <Button variant="go" onClick={() => a.onOpenPod(podId)} className="flex-1">
                Open trip
              </Button>
            ) : free > 0 ? (
              <Button variant="signal" busy={a.busy} onClick={a.onJoin} className="flex-1">
                I’m in
              </Button>
            ) : null
          ) : mineIn ? (
            <>
              {inCount >= 2 && (
                <Button variant="go" busy={a.busy} onClick={a.onLock} className="flex-1">
                  Lock trip
                </Button>
              )}
              <Button variant="ghost" busy={a.busy} onClick={a.onLeave}>
                Leave
              </Button>
            </>
          ) : (
            <Button variant="signal" busy={a.busy} onClick={a.onJoin} disabled={free === 0} className="flex-1">
              {free === 0 ? 'Full' : 'I’m in'}
            </Button>
          )}
          {!locked || free > 0 ? (
            <Button variant="ghost" onClick={a.onShare} aria-label="Share this plan">
              Share
            </Button>
          ) : null}
        </div>
      )}
      {!preview && !locked && mineIn && inCount < 2 ? <p className="mt-2 text-sm text-muted">Waiting for one more person before you can lock.</p> : null}
    </article>
  );
}

export function TicketCard({ ticket, me, onCalendar }: { ticket: HopTicket; me?: string; onCalendar?: () => void }) {
  const dest = DESTINATIONS[ticket.destination];
  const time = formatTime(ticket.departAt).split(' ');
  const date = formatTripDate(ticket.departAt.slice(0, 10));
  const reason = ticket.reason ? `${ticket.reason.name} ${ticket.reason.kind === 'joined' ? 'joined' : 'left'}: fare re-split` : null;
  return (
    <section aria-label="Trip ticket" className="lacquer lacquer-frame relative mx-3 overflow-hidden rounded-[22px] text-on-ticket shadow-md">
      <div className="flex">
        <div className="min-w-0 flex-1 p-4">
          <p className="text-sm text-on-ticket/75">{ticket.direction === 'back' ? 'Back to campus from' : 'From campus to'}</p>
          <h2 className="font-display text-3xl font-semibold leading-tight">{dest.label}</h2>
          <p className="mt-2 font-display text-5xl font-semibold leading-none num">
            {time[0]} <span className="text-xl font-medium text-on-ticket/75">{time[1]}</span>
          </p>
          <p className="mt-1 text-on-ticket/85">
            {date}, {ticket.meetingPoint}
          </p>
          <p className="text-sm text-on-ticket/75">
            {VEHICLES[ticket.vehicle].label} for {ticket.seats}
          </p>
        </div>
        <div className="brass relative w-[7.25rem] shrink-0 p-3">
          <span aria-hidden className="perf absolute inset-y-3 -left-px w-[2px]" />
          <p className="text-sm font-bold">You pay</p>
          <p className={`font-display font-semibold leading-none num ${formatINR(ticket.each).length > 4 ? 'text-[26px]' : 'text-4xl'}`}>{formatINR(ticket.each)}</p>
          <p className="mt-1 text-sm num">{ticket.over > 0 ? `${formatINR(ticket.over)} over` : 'exact split'}</p>
          <p className="mt-3 text-sm font-bold">{ticket.freeSeats > 0 ? `${ticket.freeSeats} seat${ticket.freeSeats === 1 ? '' : 's'} open` : 'Full'}</p>
        </div>
        <span aria-hidden className="absolute -top-2.5 right-[calc(7.25rem-10px)] h-5 w-5 rounded-full bg-bg" />
      </div>
      {reason ? <p className="brass px-4 py-1.5 text-sm font-bold">{reason}</p> : null}
      <ul className="divide-y divide-ticket-line border-t border-ticket-line">
        {ticket.members.map((m) => (
          <li key={m.nexconnId} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
            <span className="min-w-0">
              <span className="font-bold">{m.name}</span>
              {m.nexconnId === me ? <span className="text-on-ticket/75"> (you)</span> : null}
              {m.hall ? <span className="block text-sm text-on-ticket/75">{m.hall}</span> : null}
            </span>
            {ticket.isDemo || !m.phone ? (
              <span className="text-sm text-on-ticket/75">{m.phone}</span>
            ) : (
              <a href={`tel:+91${m.phone}`} className="min-h-11 content-center rounded-lg bg-on-ticket/10 px-3 font-bold num underline-offset-2 hover:underline">
                {m.phone}
              </a>
            )}
          </li>
        ))}
      </ul>
      {onCalendar ? (
        <div className="border-t border-ticket-line p-3">
          <button onClick={onCalendar} className="min-h-11 w-full rounded-full border border-ticket-line font-bold hover:bg-on-ticket/10">
            Add to calendar
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function TextBubble({ text, mine, sender }: { text: string; mine: boolean; sender?: string }) {
  return (
    <div className={`mx-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${mine ? 'rounded-br-md bg-ink text-bg' : 'rounded-bl-md border border-line bg-surface'}`}>
        {!mine && sender ? <p className="text-xs font-bold text-muted">{sender}</p> : null}
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </div>
  );
}

/** The trip captain's note, as it appears in a trip chat. */
export function CaptainNote({ text, live }: { text: string; live?: boolean }) {
  return (
    <div className="lacquer lacquer-frame rounded-[18px] px-4 py-3 text-on-ticket">
      <p className="flex items-center gap-2 text-xs font-bold text-on-ticket/80">
        <span aria-hidden className={`brass inline-block h-2 w-2 rounded-full ${live ? 'pulse' : ''}`} />
        Trip captain
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text || '…'}</p>
    </div>
  );
}
