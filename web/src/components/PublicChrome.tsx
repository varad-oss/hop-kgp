import Link from 'next/link';
import type { ReactNode } from 'react';

/** Header for public pages: brand, help, and a way in. */
export function PublicHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-14 w-full max-w-3xl items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold italic">
          <span aria-hidden className="brass inline-block h-2.5 w-2.5 rounded-full" />
          Hop
        </Link>
        <nav aria-label="Site" className="ml-auto flex items-center gap-1">
          <Link href="/help" className="grid min-h-11 place-items-center px-3 text-[15px] font-bold text-muted hover:text-ink">How it works</Link>
          {cta && (
            <Link href="/signin" className="grid min-h-11 place-items-center rounded-full border border-line bg-surface px-4 text-[15px] font-bold hover:bg-surface-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 text-sm md:grid-cols-[1fr_auto_auto] md:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-semibold italic">
            <span aria-hidden className="brass inline-block h-2 w-2 rounded-full" />
            Hop
          </p>
          <p className="mt-1 max-w-[36ch] text-muted">Ride-sharing rooms for IIT Kharagpur students. A student project, not affiliated with the institute.</p>
        </div>
        <nav aria-label="Product" className="flex flex-col [&_a]:flex [&_a]:min-h-11 [&_a]:items-center">
          <Link href="/help" className="hover:underline">How it works</Link>
          <Link href="/stats" className="hover:underline">Live numbers</Link>
          <Link href="/signin" className="hover:underline">Sign in</Link>
        </nav>
        <nav aria-label="Legal" className="flex flex-col [&_a]:flex [&_a]:min-h-11 [&_a]:items-center">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Reading layout for help and legal pages. */
export function PublicPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 md:px-6">
        <article className="max-w-[68ch] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:mt-5 [&_h3]:font-bold [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <h1 className="font-display text-[40px] font-semibold leading-tight">{title}</h1>
          {intro ? <p className="text-lg text-muted">{intro}</p> : null}
          {children}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
