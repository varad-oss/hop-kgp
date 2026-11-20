import Link from 'next/link';
import { PublicPage } from '@/components/PublicChrome';

export const metadata = { title: 'How Hop works', description: 'Rooms, plans, locking, fares and what is shared when, for IIT Kharagpur students sharing a ride.' };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Help() {
  return (
    <PublicPage title="How Hop works" intro="Everyone from KGP going the same way on the same day ends up in one room. One plan gets locked, and the fare splits itself.">
      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          ['#steps', 'The four steps'],
          ['#fares', 'Fares'],
          ['#shared', 'What’s shared when'],
          ['#safety', 'Safety'],
          ['#faq', 'Questions'],
          ['#contact', 'Contact'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="grid min-h-10 place-items-center rounded-full border border-line bg-surface px-3.5 font-bold hover:bg-surface-2">
            {label}
          </a>
        ))}
      </nav>

      <h2 id="steps">The four steps</h2>
      <ol className="mt-4 flex flex-col gap-5">
        {[
          ['Post your trip', 'Pick leaving or coming back, the station (Howrah, Santragachi, Kolkata airport or Kharagpur station), the day, a time window and how many large bags you have. You land in that day’s room.'],
          ['Join or propose a plan', 'A plan is a departure time, a meeting point, a vehicle, the total fare and the number of seats. Tap “I’m in” on one, or propose your own.'],
          ['Lock it', 'Once at least two people are in, anyone in the plan can lock it. Hop opens a private trip with a ticket, everyone’s numbers and a chat.'],
          ['Travel', 'Open seats stay open until departure, and anyone who joins or leaves re-splits the fare. “Catch me up” writes a short summary of the plan and the chat.'],
        ].map(([title, body], i) => (
          <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-3">
            <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-xl font-semibold text-bg">{i + 1}</span>
            <span>
              <span className="block font-bold">{title}</span>
              <span className="mt-1 block text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      <h2 id="fares">Fares</h2>
      <p>The person proposing a plan enters the total fare: what the cab, toto or agency quoted. Hop divides it by the people in the plan and rounds each share up to the next rupee, so a ₹2,800 cab for three is ₹934 each, ₹2 over. The ticket always shows the current share.</p>
      <p>Hop doesn’t take payments or book vehicles. You pay the driver, or each other, the way you normally would.</p>

      <h2 id="shared">What’s shared when</h2>
      <ul>
        <li><strong>In a room:</strong> your name, hall, time window and number of bags.</li>
        <li><strong>In a locked trip:</strong> your mobile number, shown only to the people in that trip.</li>
        <li><strong>On the Departures board and share links:</strong> counts and times only, never names or numbers.</li>
        <li>Phone numbers typed into a room’s chat are blocked before they’re delivered, so numbers only travel through a locked trip.</li>
      </ul>

      <h2 id="safety">Safety</h2>
      <ul>
        <li>Only @kgpian.iitkgp.ac.in Google accounts can sign in, and that’s checked on the server, not just in the app.</li>
        <li>Meet at a campus gate, check the vehicle number in the trip chat before you get in, and tell a friend your plan.</li>
        <li>If someone makes you uncomfortable, leave the trip (your seat reopens and the fare re-splits) and {contact ? <a className="underline" href={`mailto:${contact}`}>email us</a> : 'tell us using the contact details below'}.</li>
      </ul>

      <h2 id="faq">Questions</h2>
      <h3>Do I need to post a trip to see who’s going?</h3>
      <p>No. Sign in and open <Link href="/departures" className="underline">Departures</Link> to see every upcoming room with how many are going and what’s planned. To see names and join a plan, post your trip into that room.</p>
      <h3>Can I be in two trips on the same day?</h3>
      <p>Not in the same room. Locking one plan takes you out of the others, so nobody gets double-counted.</p>
      <h3>What if I lock and then my plans change?</h3>
      <p>Open the trip and tap Leave. Your seat opens up and the others see the new split straight away.</p>
      <h3>Does the AI see my number?</h3>
      <p>No. “Catch me up” sends only the trip details, names and recent chat text to the model, never phone numbers. Its summary is marked “Trip captain” so you can tell it apart from people.</p>
      <h3>Chat won’t connect on campus WiFi.</h3>
      <p>Some campus networks block chat connections. Switch to mobile data and tap Reconnect. Your trips and tickets still load either way.</p>
      <h3>Can I try it without signing in?</h3>
      <p>Yes. “Try the demo” on the <Link href="/" className="underline">home page</Link> opens a private room with two sample travellers. Nothing there reaches real students.</p>

      <h2 id="contact">Contact</h2>
      <p>
        {contact ? (
          <>Questions, problems or deleting your data: <a className="underline" href={`mailto:${contact}`}>{contact}</a>.</>
        ) : (
          <>For questions, problems or deleting your data, use “How was the trip?” at the end of any trip, or reach the developer through the Nexconn Build Challenge submission page.</>
        )}
      </p>
    </PublicPage>
  );
}
