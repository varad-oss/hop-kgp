import Link from 'next/link';
import { Container, PageIntro, SitePage } from '@/components/PublicChrome';
import { DemoFrame, type DemoStep } from '@/components/site/DemoFrame';

export const metadata = { title: 'Try the demo', description: 'Lock a trip, watch the fare re-split and ask the trip captain, in a private demo room. No account needed.' };

const STEPS: DemoStep[] = [
  {
    on: 'start',
    title: 'Open your demo room',
    body: 'You get a private room for Howrah tomorrow with two sample travellers, Aarav and Meera, and Aarav’s plan for 6:30 AM.',
    sdk: 'a server-issued token, a group channel, Hop:Intent and Hop:Proposal cards',
  },
  {
    on: 'room',
    title: 'Tap I’m in, then Lock trip',
    body: 'The card goes from 2 in at ₹1,400 each to 3 in at ₹934. Then lock it: the room hands you a private trip.',
    sdk: 'message metadata updates the card live; a new private group channel for the trip',
  },
  {
    on: 'trip',
    title: 'Watch the fare re-split, then catch up',
    body: 'Tap “Demo: Meera leaves”. The ticket re-splits to ₹1,400 for the two of you. Then tap Catch me up and the trip captain writes a summary as you watch.',
    sdk: 'a re-sent Hop:Ticket card; an RC:StreamMsg streamed by Gemini',
  },
];

export default function Demo() {
  return (
    <SitePage>
      <PageIntro
        title="Try Hop in about a minute"
        lead="No account needed. The demo runs the real product as a guest, in a sandbox with two labelled sample travellers. Nothing you do reaches real students, and demo guests are left out of Hop’s numbers."
      />
      <Container>
        <div className="mb-8 flex flex-wrap items-center gap-3 lg:hidden">
          <Link href="/demo/start" className="brass grid min-h-12 place-items-center rounded-full px-6 font-bold shadow-sm">Start the demo</Link>
          <p className="text-sm text-muted">Opens full screen. Come back here for the steps.</p>
        </div>
        <DemoFrame steps={STEPS} />
        <div className="mt-12 grid gap-6 border-t border-line pt-10 md:grid-cols-3">
          <div>
            <p className="font-bold">Also try</p>
            <p className="mt-1 text-muted">Type a phone number into the room chat. It won’t send: numbers only appear inside a locked trip.</p>
          </div>
          <div>
            <p className="font-bold">Two browsers?</p>
            <p className="mt-1 text-muted">Each demo guest gets a private sandbox. To see two people in one room, students sign in with KGP Google.</p>
          </div>
          <div>
            <p className="font-bold">How it’s built</p>
            <p className="mt-1 text-muted">
              Every step above, with code links, is on <Link href="/built-on-nexconn" className="underline">Built on Nexconn</Link>.
            </p>
          </div>
        </div>
      </Container>
    </SitePage>
  );
}
