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
import { StreamBubble } from '@/components/StreamBubble';
import { Button, EmptyState, Shell, Sheet, Spinner, TopBar, ErrorNote, Workspace } from '@/components/ui';
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
  const [meeraGone, setMeeraGone] = useState(false);
  const [captainBusy, setCaptainBusy] = useState(false);
  const [captainError, setCaptainError] = useState<string | null>(null);

  const retries = useRef(0);
  const load = useCallback(() => {
    api
      .get<PodData>(`/api/pods/${podId}`)
      .then((d) => {
        retries.current = 0;
        setFailed(null);
        setPod(d);
      })
      .catch((e) => {
        const status = e instanceof ApiError ? e.status : 0;
        // Right after a lock the pod may still be setting up: retry quietly before showing an error.
        if (status !== 404 && retries.current < 4) {
          retries.current += 1;
          setTimeout(load, 1500);
        } else setFailed(status);
      });
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
      if (pod && pod.status !== 'pending' && !pod.ticket.isDemo && !localStorage.getItem(`hop:fb:${podId}`)) setShowFeedback(true);
    } catch {
      /* storage unavailable */
    }
  }, [pod, podId]);

  const live = pod && pod.status !== 'pending';
  const { messages, status, sendText, fetchUntil } = useChannelMessages(live ? pod.channelId : null);

  // The ticket always comes from the server, never from a chat message, so nobody can post a fake one.
  const latestTicket = pod?.ticket;
  const ticketMsgs = useMemo(() => messages.filter((m) => m.type === 'Hop:Ticket').length, [messages]);
  useEffect(() => {
    if (ticketMsgs > 0) load();
  }, [ticketMsgs, load]);

  // Keep the newest message in view, and bring it into view when I send one.
  const bottomRef = useRef<HTMLDivElement>(null);
  const textCount = useMemo(() => messages.filter((m) => m.type === 'RC:TxtMsg' || m.type === 'RC:StreamMsg').length, [messages]);
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [textCount]);

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

  async function askCaptain() {
    if (!pod) return;
    setCaptainBusy(true);
    setCaptainError(null);
    const names = new Map(pod.ticket.members.map((m) => [m.nexconnId, m.name]));
    const recent = messages
      .filter((m) => m.type === 'RC:TxtMsg')
      .slice(-30)
      .map((m) => ({
        name: names.get(m.senderId) ?? 'Someone',
        text: typeof m.content === 'string' ? m.content : String(m.content?.text ?? m.content?.content ?? ''),
      }));
    try {
      const r = await api.send<{ messageId: string | null }>('POST', `/api/pods/${podId}/captain`, { recent });
      for (let i = 0; r.messageId && i < 8; i++) {
        if (await fetchUntil(r.messageId)) break;
        await new Promise((res) => setTimeout(res, 500));
      }
    } catch (e) {
      setCaptainError(errorText(e));
    } finally {
      setCaptainBusy(false);
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
  const ticket = pod.ticket;
  const lastMineUid = lastMine?.uid;

  return (
    <>
      <TopBar
        back="/home"
        title={<h1 className="truncate font-display text-xl font-semibold">{DESTINATIONS[ticket.destination].short} trip</h1>}
        right={!archived && <Button variant="ghost" onClick={() => setLeaveOpen(true)}>Leave</Button>}
      />
      <ConnectionBanner />
      <Workspace
        sideLabel="Trip ticket"
        chatLabel="Trip chat"
        side={
          <>
            <TicketCard ticket={ticket} me={me.nexconnId} onCalendar={downloadIcs} />
            {!archived && (
              <div className="mx-3">
                <Button variant="ghost" className="w-full" busy={captainBusy} onClick={() => void askCaptain()}>
                  <span aria-hidden className="brass inline-block h-2 w-2 rounded-full" />
                  Catch me up
                </Button>
                {captainError && <p role="alert" className="mt-1 text-sm font-bold text-stop">{captainError}</p>}
              </div>
            )}
            {ticket.isDemo && (
              <div className="mx-3">
                <Button
                  variant="ghost"
                  className="w-full"
                  disabled={meeraGone || !ticket.members.some((m) => m.name === 'Demo · Meera')}
                  onClick={() => {
                    setMeeraGone(true);
                    void api.send('POST', '/api/demo/leave').then(load);
                  }}
                >
                  {meeraGone || !ticket.members.some((m) => m.name === 'Demo · Meera') ? 'Meera has left. The fare re-split.' : 'Demo: Meera leaves'}
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
            {!showFeedback && !ticket.isDemo && <ReturnTripPrompt destination={ticket.destination} />}
            {archived && <p className="mx-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">This trip has ended. The chat is read-only.</p>}
          </>
        }
        chat={
          <>
            {status === 'loading' && <Spinner label="Loading messages" />}
            {status === 'error' && <ErrorNote>Messages didn’t load. Reload to try again.</ErrorNote>}
            {status === 'ready' && messages.length === 0 && (
              <p className="mx-3 hidden text-sm text-muted lg:block">No messages yet. Agree who books the cab, or tap Catch me up for a summary.</p>
            )}
            {messages.filter((m) => m.type === 'RC:TxtMsg' || m.type === 'RC:StreamMsg').map((m) => {
              if (m.type === 'RC:StreamMsg') return <StreamBubble key={m.uid} message={m} />;
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
            <div ref={bottomRef} />
          </>
        }
        composer={archived ? undefined : <Composer chips={QUICK} disabled={status !== 'ready'} onSend={(t) => sendText(t, { needReceipt: true })} />}
      />
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
    <Shell workspace>
      <Suspense fallback={<Spinner />}>
        <PodRoute />
      </Suspense>
    </Shell>
  );
}
