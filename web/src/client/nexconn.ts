'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_INTENT, CARD_PROPOSAL, CARD_TICKET } from '@/domain/cards';
import { emitMessage, emitMetadata, getConnStatus, onChannelMessage, onMetadata, setConnStatus, setOnline, setPresenceOk, type ChatMessage } from './store';

export { useConnection, onMetadata, usePresence, usePresenceAvailable } from './store';
export type { ChatMessage } from './store';

type Sdk = typeof import('@nexconn/chat');

let sdk: Sdk | undefined;
let connecting: Promise<void> | undefined;

function toChatMessage(m: any): ChatMessage {
  let content = m.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      /* plain string content */
    }
  }
  const meta: Record<string, string> = {};
  (m.metadata as Map<string, string> | undefined)?.forEach?.((v, k) => (meta[k] = v));
  return {
    uid: m.messageId,
    senderId: m.senderUserId,
    type: m.messageType,
    content,
    sentAt: m.sentTime,
    metadata: meta,
    mine: m.direction === 1,
    raw: m,
  };
}

export function connectNexconn(): Promise<void> {
  if (connecting) return connecting;
  connecting = (async () => {
    setConnStatus('connecting');
    const res = await fetch('/api/nexconn/token', { method: 'POST' });
    if (!res.ok) throw new Error(`token ${res.status}`);
    const { token } = (await res.json()) as { token: string };
    const s = (sdk = await import('@nexconn/chat'));
    s.NCEngine.initialize({
      appKey: process.env.NEXT_PUBLIC_NEXCONN_APP_KEY!,
      areaCode: s.AreaCode.SG,
      logLevel: process.env.NODE_ENV === 'production' ? s.LogLevel.WARN : s.LogLevel.DEBUG,
    });
    s.NCEngine.registerCustomMessages(
      [CARD_INTENT, CARD_PROPOSAL, CARD_TICKET].map((messageType) => ({ messageType, isPersisted: true, isCounted: true })),
    );
    s.NCEngine.addConnectionStatusHandler(
      'hop-conn',
      new s.ConnectionStatusHandler({
        onConnectionStatusChanged: ({ status, code }) => {
          if (status === s.ConnectionStatus.CONNECTED) setConnStatus('connected');
          else if (status === s.ConnectionStatus.CONNECTING) setConnStatus('connecting');
          else if (status === s.ConnectionStatus.DISCONNECTED && code === 31010 /* RC_DISCONN_KICK: another device logged in */) setConnStatus('kicked');
          else setConnStatus('offline');
        },
      }),
    );
    s.NCEngine.addMessageHandler(
      'hop-msg',
      new s.MessageHandler({
        onMessageReceived: ({ messages }) => {
          for (const m of messages) emitMessage((m as any).channelIdentifier.channelId, toChatMessage(m));
        },
        onMessageMetadataUpdated: ({ messageId, channelIdentifier, metadata }) =>
          emitMetadata((channelIdentifier as any).channelId, messageId, metadata),
      }),
    );
    s.NCEngine.addUserHandler(
      'hop-user',
      new s.UserHandler({
        onSubscriptionChanged: ({ events }) => {
          for (const e of events) setOnline(e.userId, (e.details ?? []).some((d) => d.eventValue === 0));
        },
      }),
    );
    const timer = setTimeout(() => {
      if (!['connected', 'kicked'].includes(getConnStatus())) setConnStatus('blocked');
    }, 10_000);
    const result = await s.NCEngine.connect({ token });
    clearTimeout(timer);
    if (!result.isOk) {
      connecting = undefined;
      setConnStatus('blocked');
      throw new Error(`connect failed: ${result.code}`);
    }
  })().catch((e) => {
    connecting = undefined;
    if (getConnStatus() === 'connecting') setConnStatus('blocked');
    throw e;
  });
  return connecting;
}

export function reconnectNexconn() {
  connecting = undefined;
  return connectNexconn();
}

export function useChannelMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    seen.current = new Set();
    setMessages([]);
    setStatus('loading');

    const add = (m: ChatMessage) => {
      if (seen.current.has(m.uid)) return;
      seen.current.add(m.uid);
      setMessages((prev) => [...prev, m].sort((a, b) => a.sentAt - b.sentAt));
    };
    const offMsg = onChannelMessage(channelId, add);
    const offMeta = onMetadata(channelId, (id, meta) =>
      setMessages((prev) => prev.map((m) => (m.uid === id ? { ...m, metadata: { ...m.metadata, ...meta } } : m))),
    );

    (async () => {
      try {
        await connectNexconn();
        const s = sdk!;
        const q = s.BaseChannel.createMessagesQuery({
          channelIdentifier: new s.GroupChannelIdentifier(channelId),
          pageSize: 50,
          isAscending: false,
        });
        const r = await q.loadNextPage();
        if (cancelled) return;
        if (!r.isOk) throw new Error(`history ${r.code}`);
        (r.data?.data ?? []).forEach((m) => add(toChatMessage(m)));
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      offMsg();
      offMeta();
    };
  }, [channelId]);

  const sendText = useCallback(
    async (text: string, opts?: { needReceipt?: boolean }) => {
      if (!channelId || !sdk) throw new Error('not connected');
      const params = new sdk.SendTextMessageParams({ text });
      if (opts?.needReceipt) params.needReceipt = true;
      const r = await new sdk.GroupChannel(channelId).sendMessage(params);
      if (!r.isOk) throw new Error(`send ${r.code}`);
      if (r.data) add2(r.data);
      function add2(m: unknown) {
        const cm = toChatMessage(m);
        if (!seen.current.has(cm.uid)) {
          seen.current.add(cm.uid);
          setMessages((prev) => [...prev, cm].sort((a, b) => a.sentAt - b.sentAt));
        }
      }
    },
    [channelId],
  );

  return { messages, status, sendText };
}

/** Subscribe to online status for these users (best effort: presence may be off on the plan). */
export async function subscribePresence(userIds: string[]): Promise<void> {
  try {
    await connectNexconn();
    const s = sdk!;
    const ids = userIds.slice(0, 200);
    if (!ids.length) return;
    const r = await s.NCEngine.userModule.subscribeEvent({ userIds: ids, subscribeType: s.SubscribeType.ONLINE_STATUS });
    setPresenceOk(r.isOk);
  } catch {
    setPresenceOk(false); // presence is optional; the UI hides the dots when it is unavailable
  }
}

/** Tell the sender these messages have been read (best effort). */
export async function markRead(channelId: string, uids: string[]): Promise<void> {
  try {
    if (!sdk || !uids.length) return;
    await new sdk.GroupChannel(channelId).sendReadReceiptResponse(uids);
  } catch {
    /* receipts are optional */
  }
}

/** How many people have read one of my messages, or null when receipts are unavailable. */
export async function readByCount(channelId: string, messageId: string): Promise<number | null> {
  try {
    if (!sdk) return null;
    const q = sdk.BaseChannel.createMessagesReadReceiptUsersQuery({
      channelIdentifier: new sdk.GroupChannelIdentifier(channelId),
      messageId,
      pageSize: 50,
      status: sdk.MessageReadReceiptStatus.RESPONDED,
    });
    const r = await q.loadNextPage();
    return r.isOk ? (r.data?.data?.length ?? 0) : null;
  } catch {
    return null;
  }
}
