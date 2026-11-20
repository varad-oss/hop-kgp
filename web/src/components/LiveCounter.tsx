'use client';
import { useEffect, useState } from 'react';

export function LiveCounter() {
  const [s, setS] = useState<{ students: number; tripsLocked: number } | null>(null);
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setS(j))
      .catch(() => {});
  }, []);
  if (!s || s.students < 10) return null; // only show social proof once it is real
  return (
    <p className="text-sm font-bold num">
      {s.students} KGPians on Hop{s.tripsLocked > 0 ? `, ${s.tripsLocked} trip${s.tripsLocked === 1 ? '' : 's'} locked` : ''}
    </p>
  );
}
