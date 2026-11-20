'use client';
import { useEffect, useRef, useState } from 'react';

export type DemoStep = { title: string; body: string; sdk: string; on: 'start' | 'room' | 'trip' };

/** The live product in a phone-sized frame, with the guide's current step following the frame's page. */
export function DemoFrame({ steps }: { steps: DemoStep[] }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [where, setWhere] = useState<'start' | 'room' | 'trip'>('start');
  const [path, setPath] = useState('/demo/start');
  const [src, setSrc] = useState('/demo/start');

  useEffect(() => {
    const t = setInterval(() => {
      try {
        const p = frame.current?.contentWindow?.location.pathname;
        if (!p) return;
        setPath(p);
        setWhere(p.startsWith('/pod/') ? 'trip' : p.startsWith('/l/') ? 'room' : 'start');
      } catch {
        /* cross-origin: ignore */
      }
    }, 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
      <ol className="flex flex-col gap-3 lg:col-span-6 xl:col-span-5">
        {steps.map((s, i) => {
          const active = s.on === where;
          return (
            <li
              key={s.title}
              aria-current={active ? 'step' : undefined}
              className={`grid grid-cols-[2.5rem_1fr] gap-3 rounded-[18px] border p-4 transition ${active ? 'border-ink bg-surface shadow-sm' : 'border-line'}`}
            >
              <span aria-hidden className={`grid h-10 w-10 place-items-center rounded-full font-display text-xl font-semibold ${active ? 'brass' : 'bg-surface-2'}`}>{i + 1}</span>
              <span>
                <span className="block text-lg font-bold">{s.title}</span>
                <span className="mt-1 block text-muted">{s.body}</span>
                <span className="mt-2 block text-sm font-bold">Nexconn: <span className="font-normal text-muted">{s.sdk}</span></span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="hidden lg:col-span-6 lg:col-start-7 lg:block xl:col-span-5 xl:col-start-8">
        <div className="sticky top-24 flex flex-col items-center gap-3">
          <div className="lacquer lacquer-frame rounded-[46px] p-3 shadow-md">
            <iframe
              ref={frame}
              src={src}
              title="Hop, running live"
              style={{ height: "min(760px, calc(100dvh - 10rem))" }}
              className="block w-[372px] rounded-[36px] bg-bg"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={path} className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-4 font-bold hover:bg-surface-2">Open full screen</a>
            <button
              type="button"
              onClick={() => setSrc(`/demo/start?fresh=1&t=${Date.now()}`)}
              className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-4 font-bold hover:bg-surface-2"
            >
              Start over
            </button>
          </div>
          <p className="max-w-[372px] text-center text-sm text-muted">This is the real app, at phone size, signed in as a demo guest. Start over gives you a fresh guest and a new room.</p>
        </div>
      </div>
    </div>
  );
}
