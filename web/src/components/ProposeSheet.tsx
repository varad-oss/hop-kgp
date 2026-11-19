'use client';
import { useEffect, useState } from 'react';
import { api, errorText } from '@/client/api';
import { DESTINATIONS, FARE_PRESETS, MEETING_POINTS, VEHICLES, type DestKey, type VehicleKey } from '@/domain/catalog';
import { formatINR, splitFare } from '@/domain/fare';
import { Button, Chip, ErrorNote, Field, inputClass, Sheet } from './ui';

export function ProposeSheet({ open, onClose, lobbyId, destination, date, onDone }: { open: boolean; onClose: () => void; lobbyId: string; destination: DestKey; date: string; onDone: () => void }) {
  const [time, setTime] = useState('06:30');
  const [point, setPoint] = useState(MEETING_POINTS[0]);
  const [vehicle, setVehicle] = useState<VehicleKey>(destination === 'KGP' ? 'toto' : 'sedan');
  const [fare, setFare] = useState('');
  const [seats, setSeats] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preset = FARE_PRESETS[`${destination}:${vehicle}`];
    setFare(preset ? String(preset) : '');
    setSeats(VEHICLES[vehicle].seats);
  }, [destination, vehicle]);

  const total = parseInt(fare, 10);
  const valid = Number.isInteger(total) && total > 0 && point.trim().length > 0;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const departAt = new Date(`${date}T${time}:00+05:30`).toISOString();
      await api.send('POST', '/api/proposals', { lobbyId, departAt, meetingPoint: point.trim(), vehicle, totalFare: total, seats });
      onDone();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Propose a plan">
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Field label={`Leave for ${DESTINATIONS[destination].short} at`}>
          <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} required />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">Meet at</legend>
          <div className="flex flex-wrap gap-2">
            {MEETING_POINTS.map((p) => <Chip key={p} active={point === p} onClick={() => setPoint(p)}>{p}</Chip>)}
          </div>
          <input className={inputClass} value={point} maxLength={60} onChange={(e) => setPoint(e.target.value)} aria-label="Meeting point" />
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">Ride</legend>
          <div className="flex gap-2">
            {(Object.keys(VEHICLES) as VehicleKey[]).map((v) => <Chip key={v} active={vehicle === v} onClick={() => setVehicle(v)}>{VEHICLES[v].label}</Chip>)}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total fare (₹)" hint={destination === 'CCU' && vehicle === 'sedan' ? 'Campus agency fixed fare' : 'Check with the driver'}>
            <input className={inputClass} inputMode="numeric" value={fare} onChange={(e) => setFare(e.target.value.replace(/\D/g, ''))} required />
          </Field>
          <Field label="Seats">
            <select className={inputClass} value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
              {Array.from({ length: VEHICLES[vehicle].seats - 1 }, (_, i) => i + 2).map((n) => <option key={n}>{n}</option>)}
            </select>
          </Field>
        </div>
        {valid && <p className="text-sm text-muted num">Full cab: {formatINR(splitFare(total, seats).each)} each.</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" variant="signal" busy={busy} disabled={!valid} className="min-h-12">Post plan and join</Button>
      </form>
    </Sheet>
  );
}
