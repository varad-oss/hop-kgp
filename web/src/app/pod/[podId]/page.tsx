'use client';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, errorText } from '@/client/api';
import { markRead, readByCount, useChannelMessages } from '@/client/nexconn';
import type { Me } from '@/client/useMe';
import { AuthGate } from '@/components/AuthGate';
import { Composer } from '@/components/Composer';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { TextBubble, TicketCard } from '@/components/cards';
import { FeedbackPrompt, ReturnTripPrompt } from '@/components/PodPrompts';
import { Button, EmptyState, Shell, Sheet, Spinner, TopBar, ErrorNote } from '@/components/ui';
import type { HopTicket } from '@/domain/cards';
import { DESTINATIONS } from '@/domain/catalog';
import { ticketIcs } from '@/domain/ics';

type PodData = { status: 'pending' | 'live' | 'archived'; channelId: string; ticket: HopTicket };

const QUICK = ['At the gate', 'Running 5 min late', 'Cab number is '];

function Pod({ podId, me }: { podId: string; me: Me }) {
  const router = useRouter();
  const [pod, setPod] = useState<PodData | null>(null);
  const [failed, setFailed] = useState<number | null>(null);
  const [waited, setWaited] = useState(0);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [seenBy, setSeenBy] = useState<number | null>(null);

  const load = useCallback(() => {
    api.get<PodData>(`/api/pods/${podId}`).then(setPod).catch((e) => setFailed(e instanceof ApiError ? e.status : 0));
  }, [podId]);
  useEffect(load, [load]);

  // A pod that is still being set up is re-checked every 2 s for up to 30 s.
  useEffect(() => {
    if (!pod || pod.status !== 'pending' || waited >= 15) return;
    const t = setTimeout(() => {
      setWaited((n) => n + 1);
      load();
    }, 2000);
    return () => clearTimeout(t);
  }, [pod, waited, load]);

  useEffect(() => {
    try {
      if (pod && pod.status !== 'pending' && !localStorage.getItem(`hop:fb:${podId}`)) setShowFeedback(true);
    } catch {
      /* storage unavailable */
    }
  }, [pod, podId]);

  const live = pod && pod.status !== 'pending';
  const { messages, status, sendText } = useChannelMessages(live ? pod.channelId : null);

  const latestTicket = useMemo(() => {
    const t = [...messages].reverse().find((m) => m.type === 'Hop:Ticket');
    return (t?.content as HopTicket | undefined) ?? pod?.ticket;
  }, [messages, pod]);

  // Mark others' messages read, and show how many have read my latest message.
  const marked = useRef(new Set<string>());
  useEffect(() => {
    if (!pod || status !== 'ready') return;
    const unread = messages.filter((m) => !m.mine && m.senderId !== me.nexconnId && !marked.current.has(m.uid)).map((m) => m.uid);
    unread.forEach((u) => marked.current.add(u));
    if (unread.length) void markRead(pod.channelId, unread);
  }, [messages, status, pod, me.nexconnId]);

  const lastMine = useMemo(() => [...messages].reverse().find((m) => m.type === 'RC:TxtMsg' && (m.mine || m.senderId === me.nexconnId)), [messages, me.nexconnId]);
  useEffect(() => {
    if (!pod || !lastMine) return;
    let live = true;
    const poll = () => readByCount(pod.channelId, lastMine.uid).then((n) => live && n !== null && setSeenBy(n));
    void poll();
    const t = setInterval(poll, 6000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [pod, lastMine]);

  async function leave() {
    if (!latestTicket) return;
    setLeaveBusy(true);
    setLeaveError(null);
    try {
      await api.send('POST', `/api/proposals/${latestTicket.proposalId}/leave`);
      router.push('/home');
    } catch (e) {
      setLeaveError(errorText(e));
      setLeaveBusy(false);
    }
  }

  function downloadIcs() {
    if (!latestTicket) return;
    const ics = ticketIcs({
      podId,
      departAt: latestTicket.departAt,
      destinationLabel: DESTINATIONS[latestTicket.destination].label,
      meetingPoint: latestTicket.meetingPoint,
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'hop-trip.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (failed !== null)
    return (
      <EmptyState title={failed === 404 ? 'Trip not found' : 'Can’t load this trip'} action={<Button onClick={() => (location.href = '/home')}>Back to your trips</Button>}>
        {failed === 404 ? 'Only people in a locked trip can open it.' : 'Check your connection and try again.'}
      </EmptyState>
    );
  if (!pod) return <Spinner label="Opening your trip" />;
  if (pod.status === 'pending')
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center" role="status">
        <span className="pulse h-4 w-4 rounded-full bg-signal" />
        <h2 className="font-display text-2xl font-semibold">Setting up your pod…</h2>
        {waited >= 15 ? (
          <>
            <p className="text-muted">Still setting up. This can take a moment on a slow connection.</p>
            <Button onClick={() => { setWaited(0); load(); }}>Try again</Button>
          </>
        ) : (
          <p className="text-muted">Locking your seats and sharing numbers.</p>
        )}
      </div>
    );

  const archived = pod.status === 'archived';
  const ticket = latestTicket ?? pod.ticket;
  const lastMineUid = lastMine?.uid;

  return (
    <>
      <TopBar
        back="/home"
        title={<h1 className="truncate font-display text-xl font-semibold">{DESTINATIONS[ticket.destination].short} trip</h1>}
        right={!archived && <Button variant="ghost" onClick={() => setLeaveOpen(true)}>Leave</Button>}
      />
      <ConnectionBanner />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
        <TicketCard ticket={ticket} me={me.nexconnId} onCalendar={downloadIcs} />
        {ticket.isDemo && (
          <div className="mx-3">
            <Button variant="ghost" className="w-full" onClick={() => void api.send('POST', '/api/demo/leave').then(load)}>
              Demo: Meera leaves
            </Button>
          </div>
        )}
        {showFeedback && (
          <FeedbackPrompt
            podId={podId}
            onDone={() => {
              try {
                localStorage.setItem(`hop:fb:${podId}`, '1');
              } catch {
                /* ignore */
              }
              setShowFeedback(false);
            }}
          />
        )}
        {!showFeedback && <ReturnTripPrompt destination={ticket.destination} />}
        {archived && <p className="mx-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">This trip has ended. The chat is read-only.</p>}
        {status === 'loading' && <Spinner label="Loading messages" />}
        {status === 'error' && <ErrorNote>Messages didn’t load. Reload to try again.</ErrorNote>}
        {messages.filter((m) => m.type === 'RC:TxtMsg').map((m) => {
          const mineMsg = m.mine || m.senderId === me.nexconnId;
          const name = ticket.members.find((x) => x.nexconnId === m.senderId)?.name ?? 'Someone';
          return (
            <div key={m.uid}>
              <TextBubble
                text={typeof m.content === 'string' ? m.content : String(m.content?.text ?? m.content?.content ?? '')}
                mine={mineMsg}
                sender={name}
              />
              {mineMsg && m.uid === lastMineUid && seenBy ? <p className="mr-4 mt-0.5 text-right text-xs text-muted">Seen by {seenBy}</p> : null}
            </div>
          );
        })}
      </div>
      {!archived && (
        <>
          <Composer chips={QUICK} disabled={status !== 'ready'} onSend={(t) => sendText(t, { needReceipt: true })} />
        </>
      )}
      <Sheet open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave this trip?">
        <p className="mb-4 text-muted">Your seat opens up and the fare is re-split between the others.</p>
        {leaveError && <div className="mb-3"><ErrorNote>{leaveError}</ErrorNote></div>}
        <div className="flex gap-2">
          <Button variant="danger" busy={leaveBusy} onClick={() => void leave()}>Leave trip</Button>
          <Button variant="ghost" onClick={() => setLeaveOpen(false)}>Stay</Button>
        </div>
      </Sheet>
    </>
  );
}

function PodRoute() {
  const { podId } = useParams<{ podId: string }>();
  return <AuthGate>{(me) => <Pod podId={podId} me={me} />}</AuthGate>;
}

export default function PodPage() {
  return (
    <Shell>
      <Suspense fallback={<Spinner />}>
        <PodRoute />
      </Suspense>
    </Shell>
  );
}
