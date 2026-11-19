'use client';
import { useEffect, useState } from 'react';
import { startAnonymousSession } from '@/client/auth';
import { onMetadata, useChannelMessages } from '@/client/nexconn';
import { ConnectionBanner } from '@/components/ConnectionBanner';

export default function DevRoom() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [text, setText] = useState('');
  const { messages, status, sendText } = useChannelMessages(ready ? 'devroom' : null);

  useEffect(() => {
    (async () => {
      try {
        await startAnonymousSession();
        const g = new URLSearchParams(location.search).get('group');
        if (g) await fetch(`/api/dev/pair?group=${g}`, { method: 'POST' });
        const r = await fetch('/api/dev/join', { method: 'POST' });
        if (!r.ok) throw new Error(`join ${r.status}`);
        setReady(true);
      } catch (e) {
        setErr(String(e));
      }
    })();
  }, []);

  useEffect(() => (ready ? onMetadata('devroom', (id, m) => setLog((l) => [...l, `metadata ${id}: ${JSON.stringify(m)}`])) : undefined), [ready]);

  if (err) return <p className="p-4 text-red-700">Dev room unavailable: {err}</p>;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-3 p-4">
      <ConnectionBanner />
      <h1 className="text-lg font-semibold">Dev room ({status})</h1>
      <ul className="flex-1 space-y-1 text-sm">
        {messages.map((m) => (
          <li key={m.uid} className={m.mine ? 'text-right' : ''}>
            <b>{m.senderId.slice(0, 6)}</b> [{m.type}] {typeof m.content?.text === 'string' ? m.content.text : JSON.stringify(m.content)}{' '}
            <i>{JSON.stringify(m.metadata)}</i>
          </li>
        ))}
      </ul>
      <pre className="max-h-32 overflow-auto bg-neutral-100 p-2 text-xs">{log.join('\n')}</pre>
      <div className="flex gap-2">
        <input className="min-h-11 flex-1 rounded border px-2" value={text} onChange={(e) => setText(e.target.value)} />
        <button
          className="min-h-11 rounded bg-black px-4 text-white"
          onClick={() => {
            const t = text;
            setText('');
            void sendText(t, { needReceipt: true });
          }}
        >
          Send
        </button>
      </div>
      <button className="min-h-11 rounded border" onClick={() => void fetch('/api/dev/metadata', { method: 'POST' })}>
        Server: send proposal + update metadata in 2s
      </button>
    </main>
  );
}
