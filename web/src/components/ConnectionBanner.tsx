'use client';
import { reconnectNexconn, useConnection } from '@/client/nexconn';

const COPY = {
  connecting: 'Connecting…',
  offline: "You're offline — reconnecting…",
  blocked: 'Campus WiFi may block chat — switch to mobile data',
  kicked: 'Hop was opened on another device.',
} as const;

export function ConnectionBanner() {
  const status = useConnection();
  if (status === 'connected' || status === 'idle') return null;
  return (
    <div role="status" className="flex items-center justify-between gap-3 bg-amber-100 px-4 py-2 text-sm text-amber-950">
      <span>{COPY[status]}</span>
      {(status === 'kicked' || status === 'blocked') && (
        <button className="min-h-11 rounded-md bg-amber-900 px-3 font-medium text-white" onClick={() => void reconnectNexconn()}>
          Reconnect
        </button>
      )}
    </div>
  );
}
