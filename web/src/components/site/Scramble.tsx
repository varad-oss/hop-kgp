/** An illustration of today's hall-group scramble. Not real messages; labelled on the page. */
const LINES: { who: string; text: string; time: string }[] = [
  { who: 'Hall group', text: 'anyone going to CCU on the 25th?? morning flight', time: '9:02 PM' },
  { who: 'Hall group', text: 'Howrah 26th, 2 seats left, call me 98xxx xxxxx', time: '9:04 PM' },
  { who: 'Hall group', text: '[Sticker]', time: '9:05 PM' },
  { who: 'Hall group', text: 'is the 6:30 cab still on? who all are coming', time: '9:31 PM' },
  { who: 'Hall group', text: 'anyone CCU 25th??', time: '10:12 PM' },
  { who: 'Hall group', text: 'bro I think they already left', time: '10:40 PM' },
];

export function Scramble() {
  return (
    <figure className="m-0 overflow-hidden rounded-[22px] border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-bold">Hall group, 412 members</p>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-bold text-muted">Illustration</span>
      </div>
      <ol className="flex flex-col gap-2 px-5 py-4">
        {LINES.map((l, i) => (
          <li key={i} className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-[15px] shadow-sm">
            <span className="block">{l.text}</span>
            <span className="block text-right text-[11px] text-muted num">{l.time}</span>
          </li>
        ))}
      </ol>
      <figcaption className="border-t border-line px-5 py-3 text-sm text-muted">
        Illustration of a typical hall group, not real messages. Posts get buried, numbers go to hundreds of strangers, and nobody knows who’s actually committed.
      </figcaption>
    </figure>
  );
}
