'use client';
import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'hop-theme';

/**
 * Runs in <head> before first paint: applies a saved choice so there is no flash,
 * and keeps other tabs and the /demo iframe in step when the choice changes.
 */
export const THEME_SCRIPT = `(function(){var k='${KEY}',d=document.documentElement;function a(v){if(v==='light'||v==='dark')d.dataset.theme=v;else delete d.dataset.theme}try{a(localStorage.getItem(k))}catch(e){}addEventListener('storage',function(e){if(e.key===k)a(e.newValue)})})();`;

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  mq.addEventListener('change', onChange);
  return () => {
    mo.disconnect();
    mq.removeEventListener('change', onChange);
  };
}

/** Switches between the light and dark carriage. Remembers the choice on this device. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(KEY, next);
        } catch {}
      }}
      aria-label={theme ? `Switch to ${next} theme` : 'Switch theme'}
      title={theme ? `Switch to ${next} theme` : undefined}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2 ${className}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : theme === 'light' ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        ) : null}
      </svg>
    </button>
  );
}
