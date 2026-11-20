'use client';
import { useEffect } from 'react';
import { requestStream, useStream, type ChatMessage } from '@/client/nexconn';
import { CaptainNote } from './cards';

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
      <CaptainNote text={text} live={live} />
    </div>
  );
}
