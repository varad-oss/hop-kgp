'use client';
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'signal' | 'go' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:opacity-90',
  signal: 'bg-signal text-on-signal hover:brightness-95',
  go: 'bg-go text-on-go hover:brightness-110',
  ghost: 'border border-line bg-surface text-ink hover:bg-surface-2',
  danger: 'border border-stop text-stop bg-surface hover:bg-surface-2',
};

export function Button({
  variant = 'primary',
  busy,
  className = '',
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || busy}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {busy ? <span className="pulse">…</span> : children}
    </button>
  );
}

export function Chip({ active, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...p}
      className={`min-h-11 rounded-full border px-4 text-[15px] font-bold transition ${
        active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-8 text-muted">
      <span className="pulse inline-block h-3 w-3 rounded-full bg-signal" />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-3 p-8 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children && <p className="text-muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-stop bg-surface px-3 py-2 text-sm text-stop">
      {children}
    </p>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-surface p-0 text-ink backdrop:bg-black/50 sm:mx-auto sm:max-w-md"
      aria-label={title}
    >
      <div className="max-h-[88dvh] overflow-y-auto p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-surface-2">
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[16px] text-ink placeholder:text-muted';

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={`mx-auto flex w-full flex-1 flex-col ${wide ? 'max-w-3xl' : 'max-w-md'}`}>{children}</main>;
}

export function TopBar({ title, back, right }: { title: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-line bg-bg/95 px-3 backdrop-blur">
      {back && (
        <a href={back} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-surface-2">
          ←
        </a>
      )}
      <div className="min-w-0 flex-1">{title}</div>
      {right}
    </header>
  );
}
