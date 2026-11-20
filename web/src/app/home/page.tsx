'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, errorText } from '@/client/api';
import { connectNexconn } from '@/client/nexconn';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { AuthGate } from '@/components/AuthGate';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { Button, EmptyState, ErrorNote, Shell, Spinner, TopBar } from '@/components/ui';

type Trip = { lobbyId: string; title: string; date: string; podId: string | null; podStatus: string | null };

function Trips() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void connectNexconn().catch(() => {});
    api
      .get<{ trips: Trip[] }>('/api/me/trips')
      .then((r) => setTrips(r.trips))
      .catch((e) => setError(errorText(e)));
  }, []);

  if (error) return <div className="p-4"><ErrorNote>{error}</ErrorNote></div>;
  if (!trips) return <Spinner label="Loading your trips" />;
  if (trips.length === 0)
    return (
      <EmptyState title="No trips yet" action={<Link href="/new" className="grid min-h-12 place-items-center brass shadow-sm rounded-full px-6 font-bold">Post your trip</Link>}>
        Tell Hop where and when you’re headed and you’ll land in the room with everyone going your way.
      </EmptyState>
    );
  return (
    <ul className="flex flex-col gap-3 p-4">
      {trips.map((t) => (
        <li key={t.lobbyId}>
          <Link
            href={t.podId ? `/pod/${t.podId}` : `/l/${t.lobbyId}`}
            className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 hover:bg-surface-2"
          >
            <span>
              <span className="block font-display text-2xl font-semibold leading-tight">{t.title}</span>
              <span className="text-sm text-muted">{t.podId ? 'Locked. Open your ticket.' : 'In the lobby. Find a plan or propose one.'}</span>
            </span>
            <span aria-hidden className="text-xl">→</span>
          </Link>
        </li>
      ))}
      <li>
        <Link href="/new" className="grid min-h-12 place-items-center brass shadow-sm rounded-full font-bold">
          Post another trip
        </Link>
      </li>
    </ul>
  );
}

export default function HomePage() {
  async function signOut() {
    await createSupabaseBrowser().auth.signOut();
    location.href = '/';
  }
  return (
    <Shell>
      <TopBar title={<span className="font-display text-2xl font-semibold">Your trips</span>} right={<Button variant="ghost" onClick={signOut} className="min-h-11">Sign out</Button>} />
      <ConnectionBanner />
      <AuthGate>{() => <Trips />}</AuthGate>
    </Shell>
  );
}
