'use client';
import { useSyncExternalStore } from 'react';

export type ConnStatus = 'idle' | 'connecting' | 'connected' | 'offline' | 'blocked' | 'kicked';

export type ChatMessage = {
  uid: string;
  senderId: string;
  type: string;
  content: any;
  sentAt: number;
  metadata: Record<string, string>;
  mine: boolean;
  raw: unknown;
};

let status: ConnStatus = 'idle';
const statusSubs = new Set<() => void>();

export function setConnStatus(s: ConnStatus) {
  if (s === status) return;
  status = s;
  statusSubs.forEach((f) => f());
}
export const getConnStatus = () => status;

export function useConnection(): ConnStatus {
  return useSyncExternalStore(
    (cb) => {
      statusSubs.add(cb);
      return () => void statusSubs.delete(cb);
    },
    () => status,
    () => 'idle' as ConnStatus,
  );
}

type MsgCb = (m: ChatMessage) => void;
type MetaCb = (messageId: string, metadata: Record<string, string>) => void;
const msgSubs = new Map<string, Set<MsgCb>>();
const metaSubs = new Map<string, Set<MetaCb>>();

function sub<T>(map: Map<string, Set<T>>, key: string, cb: T) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(cb);
  return () => void map.get(key)?.delete(cb);
}

export const onChannelMessage = (channelId: string, cb: MsgCb) => sub(msgSubs, channelId, cb);
export const onMetadata = (channelId: string, cb: MetaCb) => sub(metaSubs, channelId, cb);
export const emitMessage = (channelId: string, m: ChatMessage) => msgSubs.get(channelId)?.forEach((f) => f(m));
export const emitMetadata = (channelId: string, id: string, meta: Record<string, string>) =>
  metaSubs.get(channelId)?.forEach((f) => f(id, meta));
