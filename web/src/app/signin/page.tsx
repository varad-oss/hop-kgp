import { Suspense } from 'react';
import { LandingActions } from '@/components/LandingActions';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { SignedInNotice } from '@/components/SignedInNotice';

export const metadata = { title: 'Sign in', description: 'Sign in to Hop with your @kgpian.iitkgp.ac.in Google account.' };

export default function SignIn() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader cta={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10">
        <h1 className="font-display text-[40px] font-semibold leading-tight">Sign in to Hop</h1>
        <p className="mt-2 text-lg text-muted">Use your @kgpian.iitkgp.ac.in Google account. Hop is only for IIT Kharagpur students, and the server checks.</p>
        <Suspense fallback={null}>
          <SignedInNotice />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={null}>
            <LandingActions />
          </Suspense>
        </div>
        <section aria-labelledby="gets" className="mt-8 rounded-[18px] border border-line bg-surface p-4 text-sm shadow-sm">
          <h2 id="gets" className="font-bold">What Hop gets</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
            <li>Your name and KGP email from Google. Nothing else from your Google account.</li>
            <li>Your hall and mobile number, only when you first join or propose a plan.</li>
            <li>Your number is shown only to people in a trip you lock.</li>
          </ul>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
