import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/built-on-nexconn', label: 'Built on Nexconn' },
  { href: '/stats', label: 'Live numbers' },
] as const;

export const REPO = 'https://github.com/varad-oss/hop-kgp';

/** The website's content width: one container for every public page. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-8 lg:px-10 ${className}`}>{children}</div>;
}

export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-[26px] font-semibold italic leading-none">
      <span aria-hidden className="brass inline-block h-2.5 w-2.5 rounded-full" />
      Hop
    </Link>
  );
}

/** Header for the public website: destinations, sign in, and the demo as the primary action. */
export function PublicHeader({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <a href="#main" className="sr-only z-40 rounded-full bg-ink px-4 py-2 font-bold text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Container className="flex min-h-16 items-center gap-8">
        <Wordmark />
        <nav aria-label="Site" className="hidden flex-1 lg:block">
          <ul className="flex gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={current === n.href ? 'page' : undefined}
                  className={`relative grid min-h-16 place-items-center px-3 text-[15px] font-bold ${current === n.href ? 'text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {n.label}
                  {current === n.href && <span aria-hidden className="brass absolute inset-x-3 bottom-0 h-[3px] rounded-t" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href="/signin" className="hidden min-h-11 place-items-center px-3 text-[15px] font-bold hover:underline sm:grid">
            Sign in / Sign up
          </Link>
          <Link href="/demo" className="brass grid min-h-11 place-items-center rounded-full px-5 text-[15px] font-bold shadow-sm">
            Try the demo
          </Link>
          <Suspense fallback={<span aria-hidden className="h-11 w-11 lg:hidden" />}>
            <MobileMenu items={[...NAV, { href: '/signin', label: 'Sign in / Sign up' }]} current={current} />
          </Suspense>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <Container className="grid gap-10 py-12 text-[15px] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-[38ch] text-muted">
            Ride-sharing rooms for IIT Kharagpur students, built on the Nexconn Chat SDK for the Nexconn Build Challenge 2026. A student project, not affiliated with the institute.
          </p>
        </div>
        <nav aria-label="Product" className="flex flex-col [&_a]:flex [&_a]:min-h-10 [&_a]:items-center">
          <p className="mb-1 text-sm font-bold text-muted">Product</p>
          <Link href="/how-it-works" className="hover:underline">How it works</Link>
          <Link href="/demo" className="hover:underline">Try the demo</Link>
          <Link href="/signin" className="hover:underline">Sign in / Sign up</Link>
        </nav>
        <nav aria-label="Project" className="flex flex-col [&_a]:flex [&_a]:min-h-10 [&_a]:items-center">
          <p className="mb-1 text-sm font-bold text-muted">Project</p>
          <Link href="/built-on-nexconn" className="hover:underline">Built on Nexconn</Link>
          <Link href="/stats" className="hover:underline">Live numbers</Link>
          <a href={REPO} className="hover:underline">Source code</a>
        </nav>
        <nav aria-label="Legal" className="flex flex-col [&_a]:flex [&_a]:min-h-10 [&_a]:items-center">
          <p className="mb-1 text-sm font-bold text-muted">Policies</p>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </nav>
      </Container>
    </footer>
  );
}

/** Website page frame: header, main, footer. */
export function SitePage({ current, children }: { current?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader current={current} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

/** A page heading block used at the top of inner website pages. */
export function PageIntro({ eyebrowHref, title, lead, children }: { eyebrowHref?: { href: string; label: string }; title: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <Container className="pb-10 pt-14 md:pt-20">
      {eyebrowHref ? (
        <Link href={eyebrowHref.href} className="text-[15px] font-bold text-muted hover:text-ink">
          ← {eyebrowHref.label}
        </Link>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="font-display text-[44px] font-semibold leading-[1.04] md:text-[60px]">{title}</h1>
          <p className="mt-5 max-w-[56ch] text-lg text-muted md:text-xl">{lead}</p>
        </div>
        {children ? <div className="lg:col-span-4 lg:self-end">{children}</div> : null}
      </div>
    </Container>
  );
}

/** Reading layout for policy pages. */
export function PublicPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <SitePage>
      <Container className="pt-14">
        <article className="max-w-[68ch] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:mt-5 [&_h3]:font-bold [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <h1 className="font-display text-[44px] font-semibold leading-tight">{title}</h1>
          {intro ? <p className="text-lg text-muted">{intro}</p> : null}
          {children}
        </article>
      </Container>
    </SitePage>
  );
}
