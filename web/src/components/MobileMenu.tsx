'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

/** The website menu on narrow screens: a disclosure panel under the header. */
export function MobileMenu({ items, current }: { items: { href: string; label: string }[]; current?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface"
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav id={id} aria-label="Site" className="absolute inset-x-0 top-full border-b border-line bg-bg shadow-md">
          <ul className="mx-auto flex max-w-[1200px] flex-col px-5 py-2">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={current === i.href ? 'page' : undefined} className="flex min-h-12 items-center border-b border-line text-lg font-bold last:border-0">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
