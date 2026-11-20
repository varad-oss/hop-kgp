# Hop: website architecture (proposed, awaiting approval)

## 1. Sitemap

```
Public website (laptop-first, full width, shared header and footer)
├── /                     Home: problem → solution → journey → what's new → try it
├── /how-it-works         The four phases with real components, rules (fares, locking, re-split), FAQ  [replaces /help, which redirects]
├── /built-on-nexconn     Architecture, SDK feature map with file links and where to see each one, trust model, demo-ID disclosure
├── /demo                 Judge walkthrough: steps on the left, the live product on the right (desktop); full screen on phones
├── /stats                Live real numbers (demo excluded) + "Beyond KGP" plan (labelled as a plan)
├── /signin               KGP Google sign-in, wrong-account and failed-return states, demo door
├── /privacy, /terms      Policies
└── /p/[id]               Public share page for a plan (restyled to the website frame)

Product (signed in or demo guest; app shell)
├── /home                 Trips: next departure, needs you, upcoming, past
├── /departures           Board of upcoming rooms (filters in URL)
├── /account              Profile, policies, sign out
├── /new                  Post a trip
├── /l/[id]               Room: desktop is two panes (plans + people | chat); phone stays one column
└── /pod/[id]             Trip: desktop is two panes (ticket + actions | chat); phone stays one column

System: 404, error boundary
```

## 2. Navigation

- **Public header:** wordmark, How it works, Built on Nexconn, Live numbers, a **Try the demo** button and a Sign in link. On phones it collapses to the wordmark, Try the demo, and a menu button that opens a sheet with the same links.
- **Public footer:** the same destinations plus Privacy and Terms, and a note that Hop is a student project and not affiliated with the institute.
- **App header (signed in):** Trips, Departures and Account plus Post a trip (unchanged). The wordmark links to `/home`. A "Hop website" link in Account goes back to `/`.
- **Separation:** the public site never shows app tabs, and the app never shows marketing sections.

## 3. Feature-to-destination map

| Existing feature | Today | New destination |
|---|---|---|
| Landing (hero, sample ticket, steps, privacy table, FAQ) | `/` phone column | `/` laptop-first story; the steps and FAQ move to `/how-it-works` |
| Help page | `/help` | `/how-it-works` (`/help` redirects) |
| Live numbers | `/stats` | `/stats` + Beyond KGP |
| Demo start | Button on `/` | `/demo` guided page; the button on `/` and in the header goes there |
| SDK usage | README only | `/built-on-nexconn` + README |
| Room, trip, post, trips, departures, account | App routes | Same routes; the room and trip get desktop two-pane layouts |
| Captain, read receipts, webhook, re-split | Inside the trip and room | Unchanged; explained on `/how-it-works` and `/built-on-nexconn` |

## 4. Home page structure (top to bottom)

1. **Hero** (asymmetric). Left: "The ride home, sorted in one room." / "Every KGP student going to Howrah, CCU, Santragachi or KGP station on your day, in one room that ends in a locked plan and a split fare." Buttons: Try the demo (primary), Sign in with KGP Google. Right: the **Trip Ticket** with a one-time re-split moment (₹1,400 → ₹934 when "Riya joins"), overlapping a **departure board** card fed by real rooms. When there are no rooms, it says "Sample" with sample rows.
2. **The scramble:** a side-by-side. Left is an illustrative hall-group thread (labelled "Illustration"; buried posts, numbers in public, "anyone??"). Right is the same need in Hop: one plan card, "3 in".
3. **Four phases strip** (Post, Room, Lock, Travel day), each with one real UI fragment, linking to `/how-it-works`.
4. **What's new here:** five specific interactions, each one line with a link to see it: rooms that form themselves, plans you vote on, lock-and-split, the number shield, the streaming trip captain.
5. **Built on Nexconn teaser:** the SDK features as a compact list, linking to `/built-on-nexconn`.
6. **Try it:** a lacquer band with two doors (Try the demo; KGP students sign in) and a share-Hop QR for students on laptops.

## 5. Judge demo page (`/demo`)

- **Desktop:** two columns. Left: numbered steps (Start the demo, Tap I'm in, Lock trip, Watch Meera leave, Catch me up, Open the ticket), each with what you should see and which Nexconn feature is involved. Right: the real app in a 390×844 frame (a same-origin iframe of `/demo/start`), with a **Open full screen** link.
- **Phone:** the steps as a short list plus a Start the demo button that opens the app full screen.
- **States:** loading the demo, demo start failed (retry, with the reason), already in a demo (continue where you left off, or start fresh).
- **Honesty:** a caption says demo travellers Aarav and Meera are sample accounts, and demo guests are excluded from Hop's numbers.

## 6. User journeys (preserved, with new entries)

| Journey | Discover | Enter | Result | Next |
|---|---|---|---|---|
| Judge evaluates | Opens the URL on a laptop | Home → Try the demo → `/demo` | Locks a trip, sees the re-split and captain stream | `/built-on-nexconn` to verify the SDK; `/stats` |
| Student posts a trip | Shared link, QR or home | Sign in → `/new` | Lands in the room | Joins or proposes, locks; ticket |
| Student checks demand | Home board or `/departures` | `/departures` | Sees counts per day and station | Posts into a room |
| Shared plan link | WhatsApp share | `/p/[id]` | Sees the plan summary (counts only) | Sign in → post → join (confirm tap) |

## 7. Implementation sequence (after approval)

1. Public frame: header with mobile menu, footer, tokens for the wider grid.
2. Home (with the live board API reused, counts only).
3. `/how-it-works` (merge `/help`) and `/built-on-nexconn`.
4. `/demo` (embedded live app plus steps).
5. `/stats` + Beyond KGP; restyle `/p/[id]`.
6. Desktop two-pane room and trip.
7. P1: typing indicators.
8. Validate at 1366, 1440, 1536, 1920, tablet and phone; fix; score; deploy.
9. P0 deliverables: README update, public repo (with OK), write-up PDF, video script.

**Unchanged:** the backend, database, Nexconn integration, auth and all API contracts. The only new API is a public **counts-only** board summary for the home hero: no names, demo excluded, rate limited.
