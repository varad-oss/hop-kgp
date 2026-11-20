'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ConnectionBanner } from './ConnectionBanner';

const TABS = [
  {
    href: '/home',
    label: 'Trips',
    icon: (
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Zm11-2v12" />
    ),
  },
  {
    href: '/departures',
    label: 'Departures',
    icon: <path d="M4 6h16M4 12h16M4 18h10M18 16v4m-2-2h4" />,
  },
  {
    href: '/account',
    label: 'Account',
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  },
] as const;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/** The signed-in app frame: tabs at the bottom on phones, in the header from tablet up. */
export function AppShell({ title, subtitle, action, children }: { title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-3xl items-center gap-6 px-4 md:px-6">
          <Link href="/home" className="flex items-center gap-2 font-display text-2xl font-semibold italic">
            <span aria-hidden className="brass inline-block h-2.5 w-2.5 rounded-full" />
            Hop
          </Link>
          <nav aria-label="Main" className="hidden flex-1 md:block">
            <ul className="flex gap-1">
              {TABS.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active(t.href) ? 'page' : undefined}
                    className={`relative grid min-h-14 place-items-center px-3 text-[15px] font-bold ${active(t.href) ? 'text-ink' : 'text-muted hover:text-ink'}`}
                  >
                    {t.label}
                    {active(t.href) && <span aria-hidden className="brass absolute inset-x-3 bottom-0 h-[3px] rounded-t" />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto md:ml-0">{action}</div>
        </div>
      </header>
      <ConnectionBanner />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-12">
        <div className="mb-5">
          <h1 className="font-display text-[34px] font-semibold leading-tight md:text-[40px]">{title}</h1>
          {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
        </div>
        {children}
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active(t.href) ? 'page' : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-bold ${active(t.href) ? 'text-ink' : 'text-muted'}`}
              >
                {active(t.href) && <span aria-hidden className="brass absolute top-0 h-[3px] w-10 rounded-b" />}
                <Icon>{t.icon}</Icon>
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** A section with a quiet heading, used to group rows on a page. */
export function Section({ title, count, children, id }: { title: string; count?: number; children: ReactNode; id?: string }) {
  const hid = id ?? `s-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section aria-labelledby={hid} className="mb-8">
      <h2 id={hid} className="mb-2 flex items-baseline gap-2 text-[15px] font-bold text-muted">
        {title}
        {count !== undefined ? <span className="num font-normal">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

/** One surface, hairline-divided rows. */
export function RowList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
      {children}
    </ul>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="pulse h-16 rounded-[18px] bg-surface-2" />
      ))}
    </div>
  );
}
