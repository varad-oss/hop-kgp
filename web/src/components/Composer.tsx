'use client';
import { useState } from 'react';
import { containsPhone } from '@/domain/phone';
import { Button } from './ui';

export function Composer({ onSend, onPropose, disabled, guardPhones, chips }: { onSend: (t: string) => Promise<void>; onPropose?: () => void; disabled?: boolean; guardPhones?: boolean; chips?: string[] }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = !!guardPhones && containsPhone(text);

  async function send() {
    const t = text.trim();
    if (!t || blocked) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(t);
      setText('');
    } catch {
      setError('Message not sent. Check your connection and try again.');
    }
    setBusy(false);
  }

  return (
    <div className="sticky bottom-0 border-t border-line bg-bg/95 p-3 backdrop-blur">
      {chips && (
        <div className="-mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-3 text-sm font-bold disabled:opacity-50"
              onClick={() => {
                if (c.endsWith(' ')) setText(c);
                else void onSend(c).catch(() => setError('Message not sent. Check your connection and try again.'));
              }}
            >
              {c.trim()}
            </button>
          ))}
        </div>
      )}
      {onPropose && (
        <Button variant="signal" onClick={onPropose} className="mb-2 w-full">
          Propose a plan
        </Button>
      )}
      {blocked && <p role="alert" className="mb-2 text-sm font-bold text-stop">Numbers are shared automatically when your trip locks.</p>}
      {error && <p role="alert" className="mb-2 text-sm font-bold text-stop">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          aria-label="Message"
          className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-[16px]"
          placeholder="Message the room"
          maxLength={500}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" busy={busy} disabled={disabled || blocked || !text.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
