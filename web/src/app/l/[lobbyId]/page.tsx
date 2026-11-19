'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, errorText } from '@/client/api';
import { markLinkOpen } from '@/client/funnel';
import { subscribePresence, useChannelMessages, usePresence } from '@/client/nexconn';
import { shareProposal } from '@/client/share';
import { AuthGate } from '@/components/AuthGate';
import { Composer } from '@/components/Composer';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { IntentCard, ProposalCard, TextBubble } from '@/components/cards';
import { ProfileModal } from '@/components/ProfileModal';
import { ProposeSheet } from '@/components/ProposeSheet';
import { Button, EmptyState, Shell, Spinner, TopBar } from '@/components/ui';
import { parseProposalMeta, type HopIntent, type HopProposal } from '@/domain/cards';
import { DESTINATIONS, WINDOWS, type DestKey, type Direction, type WindowKey } from '@/domain/catalog';
import { formatTime, formatTripDate, lobbyTitle, summaryLine } from '@/domain/copy';
import { fareLine } from '@/domain/fare';
import type { Me } from '@/client/useMe';

type Summary = {
  lobby: { id: string; destination: DestKey; direction: Direction; date: string; channelId: string };
  going: number;
  windows: Partial<Record<WindowKey, number>>;
  openProposals: number;
  lockedProposals: number;
  members: { nexconnId: string; name: string }[];
  myIntent: { window: WindowKey; bags: number } | null;
};

function textOf(c: any): string {
  return typeof c === 'string' ? c : String(c?.text ?? c?.content ?? '');
}

function Lobby({ lobbyId, me }: { lobbyId: string; me: Me }) {
  const router = useRouter();
  const params = useSearchParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState<{ status: number } | null>(null);
  const channelId = summary?.lobby.channelId ?? null;
  const { messages, status, sendText } = useChannelMessages(channelId);
  const online = usePresence();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileFor, setProfileFor] = useState<null | (() => void)>(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  useEffect(markLinkOpen, []);

  const refresh = useCallback(() => {
    api.get<Summary>(`/api/lobbies/${lobbyId}/summary`).then(setSummary).catch((e) => setLoadError({ status: e instanceof ApiError ? e.status : 0 }));
  }, [lobbyId]);
  useEffect(refresh, [refresh]);

  // Refresh the pinned header whenever cards arrive or change.
  const cardCount = useMemo(() => messages.filter((m) => m.type.startsWith('Hop:')).length, [messages]);
  const metaSig = useMemo(() => messages.map((m) => m.metadata.inCount ?? '').join(','), [messages]);
  useEffect(() => {
    if (summary) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardCount, metaSig]);

  useEffect(() => {
    const others = summary?.members.map((m) => m.nexconnId).filter((id) => id !== me.nexconnId) ?? [];
    if (others.length) void subscribePresence(others);
  }, [summary?.members.length, me.nexconnId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (atBottom.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const act = useCallback(
    async (proposalId: string, kind: 'join' | 'leave' | 'lock') => {
      setBusyId(proposalId);
      setErrors((e) => ({ ...e, [proposalId]: '' }));
      try {
        const r = await api.send<{ result: string; podId: string | null }>('POST', `/api/proposals/${proposalId}/${kind}`);
        if (r.podId && (kind === 'lock' || (kind === 'join' && r.result === 'joined'))) router.push(`/pod/${r.podId}`);
        else refresh();
      } catch (e) {
        if (e instanceof ApiError && e.status === 428) setProfileFor(() => () => void act(proposalId, kind));
        else setErrors((x) => ({ ...x, [proposalId]: errorText(e) }));
      }
      setBusyId(null);
    },
    [refresh, router],
  );

  // Shared card link: ?join=<proposalId> joins once the lobby is ready.
  const joined = useRef(false);
  useEffect(() => {
    const id = params.get('join');
    if (id && summary && summary.myIntent && !joined.current) {
      joined.current = true;
      void act(id, 'join');
    }
  }, [params, summary, act]);

  if (loadError)
    return (
      <EmptyState
        title={loadError.status === 404 ? 'Room not found' : 'Can’t load this room'}
        action={<Button onClick={() => (loadError.status === 404 ? (location.href = '/home') : location.reload())}>{loadError.status === 404 ? 'Back to your trips' : 'Try again'}</Button>}
      >
        {loadError.status === 404 ? 'This room doesn’t exist or isn’t open to your account.' : 'Check your connection and try again.'}
      </EmptyState>
    );
  if (!summary) return <Spinner label="Opening the room" />;

  const { lobby } = summary;
  const dest = DESTINATIONS[lobby.destination];
  const title = lobbyTitle(dest.label, lobby.direction, lobby.date);

  function share(p: HopProposal, inCount: number) {
    void shareProposal({
      text: `${fareLine({ totalFare: p.totalFare, inCount, seats: p.seats })}. ${dest.label} ${formatTripDate(lobby.date)}, ${formatTime(p.departAt)}. Join on Hop:`,
      url: `${location.origin}/p/${p.proposalId}`,
    });
  }

  return (
    <>
      <TopBar
        back="/home"
        title={
          <div className="leading-tight">
            <h1 className="truncate font-display text-xl font-semibold">{title}</h1>
            <p className="truncate text-sm text-muted num">{summaryLine({ going: summary.going, windows: summary.windows, openProposals: summary.openProposals })}</p>
          </div>
        }
      />
      <ConnectionBanner />
      <ul className="flex gap-3 overflow-x-auto border-b border-line px-4 py-2 text-sm" aria-label="People in this room">
        {summary.members.map((m) => (
          <li key={m.nexconnId} className="flex shrink-0 items-center gap-1.5">
            <span
              role="img"
              aria-label={m.nexconnId === me.nexconnId || online.has(m.nexconnId) ? 'online' : 'offline or unknown'}
              className={`h-2.5 w-2.5 rounded-full ${m.nexconnId === me.nexconnId || online.has(m.nexconnId) ? 'bg-go' : 'border border-muted'}`}
            />
            {m.nexconnId === me.nexconnId ? 'You' : m.name.replace('Demo · ', '')}
          </li>
        ))}
      </ul>

      <div
        className="flex flex-1 flex-col gap-3 overflow-y-auto py-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {status === 'loading' && <Spinner label="Loading messages" />}
        {status === 'error' && (
          <EmptyState title="Messages didn’t load" action={<Button onClick={() => location.reload()}>Try again</Button>}>
            Check your connection. Campus WiFi sometimes blocks chat; mobile data usually works.
          </EmptyState>
        )}
        {status === 'ready' && messages.length === 0 && (
          <EmptyState title="You’re the first one here">Share this room so others find it, or propose a plan to get things moving.</EmptyState>
        )}
        {messages.map((m) => {
          if (m.type === 'Hop:Intent') {
            const i = m.content as HopIntent;
            return <IntentCard key={m.uid} intent={{ ...i, window: i.window in WINDOWS ? i.window : 'w1' }} mine={i.nexconnId === me.nexconnId} />;
          }
          if (m.type === 'Hop:Proposal') {
            const p = m.content as HopProposal;
            return (
              <ProposalCard
                key={m.uid}
                proposal={p}
                meta={parseProposalMeta(m.metadata)}
                me={me.nexconnId}
                busy={busyId === p.proposalId}
                error={errors[p.proposalId] || null}
                onJoin={() => void act(p.proposalId, 'join')}
                onLeave={() => void act(p.proposalId, 'leave')}
                onLock={() => void act(p.proposalId, 'lock')}
                onShare={() => share(p, parseProposalMeta(m.metadata).inCount)}
                onOpenPod={(id) => router.push(`/pod/${id}`)}
              />
            );
          }
          if (m.type === 'RC:TxtMsg') {
            const name = summary.members.find((x) => x.nexconnId === m.senderId)?.name ?? 'Someone';
            return <TextBubble key={m.uid} text={textOf(m.content)} mine={m.senderId === me.nexconnId || m.mine} sender={name.replace('Demo · ', 'Demo · ')} />;
          }
          return null;
        })}
        <div ref={bottomRef} />
      </div>

      <Composer
        guardPhones
        disabled={status !== 'ready'}
        onSend={(t) => sendText(t)}
        onPropose={summary.myIntent ? () => setProposeOpen(true) : undefined}
      />
      <ProposeSheet
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        lobbyId={lobbyId}
        destination={lobby.destination}
        date={lobby.date}
        onDone={() => {
          setProposeOpen(false);
          refresh();
        }}
      />
      <ProfileModal
        open={!!profileFor}
        onClose={() => setProfileFor(null)}
        onSaved={() => {
          const retry = profileFor;
          setProfileFor(null);
          retry?.();
        }}
      />
    </>
  );
}

function LobbyRoute() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  return <AuthGate>{(me) => <Lobby lobbyId={lobbyId} me={me} />}</AuthGate>;
}

export default function LobbyPage() {
  return (
    <Shell>
      <Suspense fallback={<Spinner />}>
        <LobbyRoute />
      </Suspense>
    </Shell>
  );
}
