'use client';
import { useState } from 'react';
import { api, errorText } from '@/client/api';
import { HALLS } from '@/domain/catalog';
import { Button, ErrorNote, Field, inputClass, Sheet } from './ui';

export function ProfileModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [hall, setHall] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.send('PATCH', '/api/me/profile', { hall, phone });
      onSaved();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Before you join">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <p className="text-muted">Your hall and number are only shown to people in a trip you lock.</p>
        <Field label="Your hall">
          <input className={inputClass} list="halls" value={hall} onChange={(e) => setHall(e.target.value)} placeholder="e.g. Azad" autoComplete="off" />
          <datalist id="halls">{HALLS.map((h) => <option key={h} value={h} />)}</datalist>
        </Field>
        <Field label="Mobile number" hint="10 digits. Not visible in the lobby.">
          <input className={inputClass} type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" variant="signal" busy={busy} disabled={!hall.trim() || !phone.trim()} className="min-h-12">
          Save and continue
        </Button>
      </form>
    </Sheet>
  );
}
