export const metadata = { title: 'Privacy' };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-5 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="font-display text-4xl font-semibold">Privacy</h1>
      <p className="text-muted">Hop helps IIT Kharagpur students share a ride home. This is what it keeps and why.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name and @kgpian email, from Google sign-in. Hop asks Google for nothing else.</li>
        <li>Your hall and mobile number, only when you first join a plan.</li>
        <li>The trips you post, your votes, your messages and any feedback you send.</li>
      </ul>

      <h2>Who sees it</h2>
      <ul>
        <li>Your name and hall are visible to people in the same room.</li>
        <li>Your mobile number is hidden from everyone until a trip locks, then shown only to people in that locked trip.</li>
        <li>The public share page for a plan shows counts and times only, never names or numbers.</li>
      </ul>

      <h2>Where it is stored</h2>
      <p>Account and trip data is stored with Supabase (Mumbai). Chat messages are handled by Nexconn (Singapore). We do not sell data or show ads.</p>

      <h2>Demo accounts</h2>
      <p>“Try the demo” creates a temporary guest account with no email. Demo activity is kept out of Hop’s public numbers.</p>

      <h2>Deleting your data</h2>
      <p>{contact ? <>Email <a className="underline" href={`mailto:${contact}`}>{contact}</a> and we will delete your account and trips.</> : 'Message the Hop developer from the Hop sign-in page and we will delete your account and trips.'}</p>
    </main>
  );
}
