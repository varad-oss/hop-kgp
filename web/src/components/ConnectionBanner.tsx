'use client';
import { reconnectNexconn, useConnection } from '@/client/nexconn';

const COPY = {
  connecting: 'Connecting to chat…',
  offline: 'You’re offline. Plans and tickets you’ve opened stay visible; we’ll reconnect when you’re back.',
  blocked: 'Chat can’t connect. Campus WiFi may be blocking it: switch to mobile data and tap Reconnect.',
  kicked: 'Hop was opened on another device, so chat paused here.',
} as const;

export function ConnectionBanner() {
  const status = useConnection();
  if (status === 'connected' || status === 'idle') return null;
  return (
    <div role="status" className="border-b border-line bg-surface-2 px-4 py-2 text-sm text-ink">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span aria-hidden className={`brass inline-block h-2 w-2 shrink-0 rounded-full ${status === 'connecting' ? 'pulse' : ''}`} />
          {COPY[status]}
        </span>
        {(status === 'kicked' || status === 'blocked') && (
          <button className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 font-bold" onClick={() => void reconnectNexconn()}>
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
