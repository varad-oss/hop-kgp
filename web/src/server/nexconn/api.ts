import { signHeaders } from './sign';

export class NexconnError extends Error {
  constructor(public code: number, public path: string) {
    super(`Nexconn ${path} failed with code ${code}`);
    this.name = 'NexconnError';
  }
}

export const GROUP_EXISTS_CODE = 25409;

export interface NexconnApi {
  issueToken(userId: string, name: string): Promise<string>;
  createGroup(p: { channelId: string; name: string; owner: string; userIds?: string[] }): Promise<'created' | 'exists'>;
  joinGroup(channelId: string, userIds: string[]): Promise<void>;
  leaveGroup(channelId: string, userIds: string[]): Promise<void>;
  sendGroupMessage(p: {
    fromUserId: string;
    channelId: string;
    messageType: string;
    content: unknown;
    metadata?: Record<string, string>;
    needReadReceipt?: boolean;
  }): Promise<string>;
  setMessageMetadata(p: { messageId: string; channelId: string; userId: string; metadata: Record<string, string> }): Promise<void>;
  sendGroupStreamChunk(p: {
    fromUserId: string;
    channelId: string;
    content: string;
    seq: number;
    complete: boolean;
    messageId?: string;
  }): Promise<string>;
}

interface Config {
  appKey: string;
  appSecret: string;
  hosts: [string, string];
  fetchImpl?: typeof fetch;
}

const TIMEOUT_MS = 5000;

export function createNexconnApi(cfg: Config): NexconnApi {
  const doFetch = cfg.fetchImpl ?? fetch;

  async function attempt(host: string, path: string, body: unknown): Promise<Record<string, any>> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const nonce = String(Math.floor(Math.random() * 9e9) + 1e9);
      const headers = await signHeaders(cfg.appKey, cfg.appSecret, nonce, String(Date.now()));
      const res = await doFetch(`https://${host}${path}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      return (await res.json()) as Record<string, any>;
    } finally {
      clearTimeout(timer);
    }
  }

  async function call(path: string, body: unknown, allowCodes: number[] = []): Promise<Record<string, any>> {
    let json: Record<string, any>;
    try {
      json = await attempt(cfg.hosts[0], path, body);
    } catch {
      json = await attempt(cfg.hosts[1], path, body);
    }
    if (json.code !== 0 && !allowCodes.includes(json.code)) throw new NexconnError(json.code ?? -1, path);
    return json;
  }

  return {
    async issueToken(userId, name) {
      const j = await call('/v4/auth/access-token/issue', { userId, name });
      return j.result.accessToken as string;
    },
    async createGroup({ channelId, name, owner, userIds }) {
      const j = await call(
        '/v4/group-channel/create',
        { channelId, name, owner, ...(userIds?.length ? { userIds } : {}), permissions: { joinPerm: 1 } },
        [GROUP_EXISTS_CODE],
      );
      return j.code === GROUP_EXISTS_CODE ? 'exists' : 'created';
    },
    async joinGroup(channelId, userIds) {
      await call('/v4/group-channel/join', { channelId, userIds });
    },
    async leaveGroup(channelId, userIds) {
      await call('/v4/group-channel/leave', { channelId, userIds });
    },
    async sendGroupMessage({ fromUserId, channelId, messageType, content, metadata, needReadReceipt }) {
      const j = await call('/v4/group-channel/message/send', {
        fromUserId,
        toChannelIds: [channelId],
        messageType,
        content: JSON.stringify(content),
        shouldPersist: 1,
        isEchoToSender: 1,
        ...(metadata ? { hasMetadata: true, metadata } : {}),
        ...(needReadReceipt ? { needReadReceipt: 1 } : {}),
      });
      return j.result.messageIds[0].messageId as string;
    },
    async setMessageMetadata({ messageId, channelId, userId, metadata }) {
      await call('/v4/channel-type/message/metadata/set', {
        messageId,
        userId,
        channelType: 3,
        channelId,
        metadata,
        isEchoToSender: 1,
      });
    },
    async sendGroupStreamChunk({ fromUserId, channelId, content, seq, complete, messageId }) {
      const j = await call('/v4/group-channel/message/stream/send', {
        fromUserId,
        toChannelId: channelId,
        messageType: 'RC:StreamMsg',
        content: { content, seq, complete, ...(seq === 1 ? { type: 'text', user: { id: fromUserId, name: 'Trip captain' } } : {}), ...(messageId ? { messageId } : {}) },
      });
      return (j.result?.messageId ?? messageId) as string;
    },
  };
}

let singleton: NexconnApi | undefined;
export function getNexconnApi(): NexconnApi {
  if (!singleton) {
    singleton = createNexconnApi({
      appKey: process.env.NEXT_PUBLIC_NEXCONN_APP_KEY!,
      appSecret: process.env.NEXCONN_APP_SECRET!,
      hosts: [process.env.NEXCONN_API_HOST ?? 'api.sg-light-api.com', process.env.NEXCONN_API_HOST_BACKUP ?? 'api-b.sg-light-api.com'],
    });
  }
  return singleton;
}
