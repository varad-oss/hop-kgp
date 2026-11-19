export const metadata = { title: 'Terms' };

export default function Terms() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-5 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="font-display text-4xl font-semibold">Terms</h1>
      <p className="text-muted">Hop is a student project built for the Nexconn Build Challenge 2026.</p>

      <h2>What Hop does</h2>
      <p>Hop helps students find co-travellers and agree a plan in chat. It does not book vehicles, employ drivers, or handle money. Fare splits are a calculation you settle between yourselves.</p>

      <h2>Your part</h2>
      <ul>
        <li>Use Hop only with your own KGP account and be respectful in rooms.</li>
        <li>Do not post other people’s numbers or personal details.</li>
        <li>Check the driver and vehicle before you travel and keep yourself safe. Hop is not responsible for the journey.</li>
      </ul>

      <h2>Removal</h2>
      <p>We may remove messages or accounts that harass others or break these terms.</p>
    </main>
  );
}
