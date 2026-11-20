'use client';
import { useEffect } from 'react';
import { requestStream, useStream, type ChatMessage } from '@/client/nexconn';

/** The trip captain's summary, filled in live as the stream arrives. */
export function StreamBubble({ message }: { message: ChatMessage }) {
  const c = (message.content ?? {}) as { content?: string; isCompleted?: boolean; complete?: boolean };
  const s = useStream(message.uid);
  const finishedAtLoad = !!(c.isCompleted ?? c.complete);
  useEffect(() => {
    if (!finishedAtLoad) void requestStream(message);
  }, [finishedAtLoad, message]);
  const text = s?.text || c.content || '';
  const live = !finishedAtLoad && !s?.done;
  return (
    <div className="mx-3" aria-live="polite">
      <div className="lacquer lacquer-frame rounded-[18px] px-4 py-3 text-on-ticket">
        <p className="flex items-center gap-2 text-xs font-bold text-on-ticket/80">
          <span aria-hidden className={`brass inline-block h-2 w-2 rounded-full ${live ? 'pulse' : ''}`} />
          Trip captain
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text || '…'}</p>
      </div>
    </div>
  );
}
