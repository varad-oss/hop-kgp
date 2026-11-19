import type { NexconnApi } from '@/server/nexconn/api';

export type FakeNexconn = NexconnApi & {
  calls: { method: string; args: unknown }[];
  failNext(method: string): void;
};

export function createFakeNexconn(): FakeNexconn {
  const calls: { method: string; args: unknown }[] = [];
  const failing = new Set<string>();
  const groups = new Set<string>();
  let n = 0;

  function rec(method: string, args: unknown) {
    calls.push({ method, args });
    if (failing.delete(method)) throw new Error(`fake nexconn: ${method} failed`);
  }

  return {
    calls,
    failNext: (m) => void failing.add(m),
    async issueToken(userId, name) {
      rec('issueToken', { userId, name });
      return `token-${userId}`;
    },
    async createGroup(p) {
      rec('createGroup', p);
      if (groups.has(p.channelId)) return 'exists';
      groups.add(p.channelId);
      return 'created';
    },
    async joinGroup(channelId, userIds) {
      rec('joinGroup', { channelId, userIds });
    },
    async leaveGroup(channelId, userIds) {
      rec('leaveGroup', { channelId, userIds });
    },
    async sendGroupMessage(p) {
      rec('sendGroupMessage', p);
      return `m${++n}`;
    },
    async setMessageMetadata(p) {
      rec('setMessageMetadata', p);
    },
    async sendGroupStreamChunk(p) {
      rec('sendGroupStreamChunk', p);
      return p.messageId ?? `m${++n}`;
    },
  };
}
