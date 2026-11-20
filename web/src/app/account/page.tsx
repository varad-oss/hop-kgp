'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorText } from '@/client/api';
import type { Me } from '@/client/useMe';
import { AppShell, RowList, Section } from '@/components/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { Button, ErrorNote, inputClass } from '@/components/ui';
import { HALLS } from '@/domain/catalog';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function ProfileForm({ me, onSaved }: { me: Me; onSaved: () => Promise<unknown> }) {
  const [hall, setHall] = useState(me.hall ?? '');
  const [phone, setPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(!me.hasPhone);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<{ field: 'hall' | 'phone' | null; text: string } | null>(null);
  const dirty = hall.trim() !== (me.hall ?? '') || (changingPhone && phone.trim() !== '');

  async function save() {
    setError(null);
    if (!hall.trim()) return setError({ field: 'hall', text: 'Enter your hall so your trip-mates know where to meet you.' });
    if (changingPhone && !phone.trim()) return setError({ field: 'phone', text: 'Enter a 10-digit mobile number.' });
    setState('saving');
    try {
      await api.send('PATCH', '/api/me/profile', { hall: hall.trim(), ...(changingPhone ? { phone } : {}) });
      await onSaved();
      setPhone('');
      setChangingPhone(false);
      setState('saved');
    } catch (e) {
      const code = (e as { error?: string }).error;
      setError({ field: code === 'bad_phone' ? 'phone' : code === 'bad_hall' ? 'hall' : null, text: errorText(e) });
      setState('idle');
    }
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="hall" className="text-sm font-bold">Hall</label>
        <input
          id="hall"
          className={inputClass}
          list="halls"
          value={hall}
          onChange={(e) => {
            setHall(e.target.value);
            setState('idle');
          }}
          aria-invalid={error?.field === 'hall'}
          aria-describedby={error?.field === 'hall' ? 'hall-err' : 'hall-hint'}
          autoComplete="off"
        />
        <datalist id="halls">{HALLS.map((h) => <option key={h} value={h} />)}</datalist>
        {error?.field === 'hall' ? <span id="hall-err" className="text-sm font-bold text-stop">{error.text}</span> : <span id="hall-hint" className="text-sm text-muted">Shown to people in a trip you lock, and next to your name in rooms.</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-bold">Mobile number</label>
        {changingPhone ? (
          <>
            <input
              id="phone"
              className={inputClass}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setState('idle');
              }}
              aria-invalid={error?.field === 'phone'}
              aria-describedby={error?.field === 'phone' ? 'phone-err' : 'phone-hint'}
            />
            {error?.field === 'phone' ? <span id="phone-err" className="text-sm font-bold text-stop">{error.text}</span> : <span id="phone-hint" className="text-sm text-muted">10 digits. Only shared inside a trip after it’s locked, never in rooms.</span>}
          </>
        ) : (
          <div className="flex min-h-11 items-center justify-between gap-3">
            <span className="num">Ends in {me.phoneLast4}</span>
            <Button variant="ghost" type="button" onClick={() => setChangingPhone(true)}>Change</Button>
          </div>
        )}
      </div>

      {error && !error.field && <ErrorNote>{error.text}</ErrorNote>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="go" busy={state === 'saving'} disabled={!dirty}>Save changes</Button>
        <span role="status" className="text-sm font-bold text-go">{state === 'saved' && !dirty ? 'Saved' : ''}</span>
      </div>
    </form>
  );
}

function Account({ me, refresh }: { me: Me; refresh: () => Promise<unknown> }) {
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    await createSupabaseBrowser().auth.signOut();
    location.href = '/';
  }
  return (
    <>
      <Section title="You">
        <div className="flex items-center gap-4">
          <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl font-semibold text-bg">
            {me.name.replace('Demo · ', '').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-tight">{me.name}</p>
            <p className="truncate text-sm text-muted">{me.isDemo ? 'Demo guest, not signed in' : me.email ?? 'Signed in with KGP Google'}</p>
          </div>
        </div>
      </Section>

      {me.isDemo && (
        <Section title="Demo">
          <div className="rounded-[18px] border border-line bg-surface p-4 shadow-sm">
            <p>You’re in a private demo with two sample travellers. Nothing here is shared with real students, and it isn’t counted in Hop’s numbers.</p>
            <Link href="/signin?next=/home" className="brass mt-3 inline-grid min-h-11 place-items-center rounded-full px-5 font-bold shadow-sm">Sign in with KGP Google</Link>
          </div>
        </Section>
      )}
      <Section title="Profile">
        <ProfileForm me={me} onSaved={refresh} />
        <p className="mt-2 text-sm text-muted">{me.isDemo ? 'Demo details stay in the demo.' : 'Your name comes from your KGP Google account.'}</p>
      </Section>

      <Section title="Help and policies">
        <RowList>
          {[
            ['/help', 'How Hop works', 'Rooms, plans, locking, fares, safety'],
            ['/privacy', 'Privacy', 'What we store and who sees it'],
            ['/terms', 'Terms', 'Using Hop'],
            ['/stats', 'Live numbers', 'Students, trips and money saved'],
          ].map(([href, label, hint]) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 hover:bg-surface-2">
                <span>
                  <span className="block font-bold">{label}</span>
                  <span className="text-sm text-muted">{hint}</span>
                </span>
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
              </Link>
            </li>
          ))}
        </RowList>
      </Section>

      <Section title="Session">
        <Button variant="ghost" busy={signingOut} onClick={() => void signOut()}>{me.isDemo ? 'End demo' : 'Sign out'}</Button>
        <p className="mt-2 text-sm text-muted">
          {CONTACT ? (
            <>To delete your account and data, email <a className="underline underline-offset-2" href={`mailto:${CONTACT}?subject=Delete my Hop account`}>{CONTACT}</a> from your KGP address.</>
          ) : (
            <>To delete your account and data, follow the steps on the <Link href="/privacy" className="underline underline-offset-2">privacy page</Link>.</>
          )}{' '}
          Locked trips keep your name for the people you travelled with.
        </p>
      </Section>
    </>
  );
}

export default function AccountPage() {
  return (
    <AppShell title="Account">
      <AuthGate>{(me, refresh) => <Account me={me} refresh={refresh} />}</AuthGate>
    </AppShell>
  );
}
