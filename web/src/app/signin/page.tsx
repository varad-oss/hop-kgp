import Link from 'next/link';
import { Suspense } from 'react';
import { LandingActions } from '@/components/LandingActions';
import { Container, SitePage } from '@/components/PublicChrome';
import { SignedInNotice } from '@/components/SignedInNotice';

export const metadata = { title: 'Sign in or sign up', description: 'Sign in or create your Hop account with your @kgpian.iitkgp.ac.in email ID.' };

export default function SignIn() {
  return (
    <SitePage>
      <Container className="grid gap-12 pt-14 md:pt-20 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 className="font-display text-[44px] font-semibold leading-[1.04] md:text-[52px]">Sign in or sign up</h1>
          <p className="mt-4 text-lg text-muted">One button for both. Continue with your @kgpian.iitkgp.ac.in email ID: if you’re new, Hop creates your account on the spot; if you’ve been here before, you’re straight back in. Hop is only for IIT Kharagpur students, and the server checks every request.</p>
          <Suspense fallback={null}>
            <SignedInNotice />
          </Suspense>
          <div className="mt-8">
            <Suspense fallback={null}>
              <LandingActions />
            </Suspense>
          </div>
        </div>
        <aside className="flex flex-col gap-6 lg:col-span-5 lg:col-start-8">
          <section aria-labelledby="gets" className="rounded-[22px] border border-line bg-surface p-6 shadow-sm">
            <h2 id="gets" className="text-lg font-bold">What Hop gets</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-muted">
              <li>Your name and KGP email ID, through Google’s sign-in page (KGP email IDs are Google accounts). Nothing else.</li>
              <li>Your hall and mobile number, only when you first join or propose a plan.</li>
              <li>Your number is shown only to people in a trip you lock.</li>
            </ul>
          </section>
          <section aria-labelledby="judge" className="rounded-[22px] border border-line p-6">
            <h2 id="judge" className="text-lg font-bold">Not a KGP student?</h2>
            <p className="mt-2 text-muted">The guided demo shows every step with sample travellers, no account needed.</p>
            <Link href="/demo" className="mt-4 inline-grid min-h-11 place-items-center rounded-full border border-line bg-surface px-5 font-bold hover:bg-surface-2">Open the guided demo</Link>
          </section>
        </aside>
      </Container>
    </SitePage>
  );
}
