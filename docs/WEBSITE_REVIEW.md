# Hop: website transformation review

Sat 21 Nov 2026, against prompt 3's rubric. Verified on the running site (local and https://hop-kgp.vercel.app).

## 1. How the application was transformed

**Before:** Hop was a 448px phone column everywhere. The landing page was one column with a sample ticket. A judge on a laptop saw a small app in the middle of the screen, and had to discover the product by clicking through it.

**After:**
- **A public website, laptop-first.** It runs on a 12-column, 1200px container with its own header (How it works, Built on Nexconn, Live numbers, Sign in, **Try the demo**), a phone menu and a full footer.
- **The home page tells the story in order:**
  - the hero, with an animated re-split ticket;
  - a live departures board (real rooms, counts only);
  - the WhatsApp scramble versus a plan card;
  - four steps shown with real components;
  - "What a group chat can't do";
  - the Nexconn teaser;
  - two ways in, plus a QR code to open Hop on a phone.
- **Dedicated pages:**
  - `/how-it-works` (it replaces `/help`, which redirects);
  - `/built-on-nexconn` (architecture, the end-to-end flow, the SDK feature table with GitHub links, the trust model, honest limits);
  - `/demo` (the live product embedded beside a guide that follows where you are);
  - `/stats` plus a "Beyond KGP" section labelled as a plan.
- **The product on desktop:** the room and the trip are now two-pane workspaces, with people, plans or ticket on the left and the chat with its composer on the right. Phones keep the single column.
- **System and supporting pages** moved into the website frame: sign in, the share page `/p/[id]`, 404, privacy and terms.

## 2. Existing features preserved, and where they live now

| Feature | Before | Now |
|---|---|---|
| KGP Google sign-in, wrong-account and failed-return states | `/signin` | `/signin` (website frame, two columns) |
| Demo sandbox | Button on `/` | `/demo` guided page, `/demo/start`, and the button on `/signin` |
| Post a trip | `/new` | `/new` (unchanged) |
| Trips home, departures board, account | `/home`, `/departures`, `/account` | Unchanged; Account links to "How Hop is built" |
| Room: cards, join, lock, propose, chat, number guard | `/l/[id]` | `/l/[id]`, two-pane on desktop |
| Trip: ticket, numbers, re-split, captain, read receipts, leave, calendar, feedback | `/pod/[id]` | `/pod/[id]`, two-pane on desktop |
| Share page | `/p/[id]` | `/p/[id]` in the website frame |
| Live numbers | `/stats` | `/stats` + Beyond KGP |
| Help and FAQ | `/help` | `/how-it-works` (redirect kept) |
| Backend, APIs, database, Nexconn, webhook, Gemini | — | Unchanged. One new read-only call: `departures(db, null)` for the public board (counts only, demo excluded, tested). |

## 3. Testing results

- **Unit and integration:** 162/162 Vitest tests pass. This includes the new test for the public board's null viewer.
- **Build:** `next build` succeeds. I found and fixed a failure where the phone menu read the URL outside `Suspense`.
- **Live routes** (curl on production): `/`, `/how-it-works`, `/built-on-nexconn`, `/demo`, `/demo/start`, `/stats`, `/signin`, `/privacy`, `/terms`, `/home`, `/departures` and `/account` all return 200. `/help` returns 308 to `/how-it-works`, and unknown URLs return 404.
- **Journeys** (scripted Chrome against production, plus the in-app browser locally):
  - In the demo: `/demo/start`, then the room, then I'm in (2 → 3 in, ₹1,400 → ₹934), then Lock, then the trip, then Meera leaves (₹1,400), then Catch me up. A real Gemini summary streamed into the desktop chat pane.
  - On `/demo`, the embedded app ran the same flow and the guide's current step followed it.
  - The phone menu opens, closes on Escape, and links work.
- **Viewports:** 1440×900, 1366×768, 1920×1080, 768 and 375, all inspected. No horizontal overflow at 375.
- **Bug found and fixed:** a ₹1,400 share was clipped to "₹1,40" in the ticket stub. It affected phones too.
- **Contrast** (computed against WCAG): every text/background token pair is at least 6.0:1 in both themes (ink/bg 14.6, muted/bg 6.1, on-signal/brass 6.0–11.5).
- **Screenshots:** `docs/media/website/` holds the home page, how-it-works, the SDK table, the demo guide, the room at 3 in, the trip with the captain, and the phone home page.

## 4. Self-evaluation (prompt 3 rubric)

| Category | Weight | Score | Evidence |
|---|---:|---:|---|
| Visual identity and design quality | 20 | 17 | One coherent carriage identity (lacquer, brass, Bodoni numerals). The departures board and ticket are domain-native, real components replace icon grids, and there are no gradient blobs or fake stats. Not reviewed by a human designer; the architecture diagram is plain. |
| Landing page and first impression | 15 | 13 | The hero answers what, who and how to try within the first screen; the board shows live data; the problem is dramatised and labelled as an illustration. There's no demo video embedded yet (the user is recording one). |
| Website information architecture | 15 | 14 | Each page has one job; the public site and the product are separate; the demo has its own destination; `/help` redirects; every footer and header link was checked. |
| Quality of individual pages | 15 | 13 | How it works, Built on Nexconn and Demo are complete and specific. Live numbers is honest but sparse until the launch; Privacy and Terms are plain text pages. |
| Functional completeness | 15 | 14 | Every pre-existing journey still works, and the room and trip gained desktop layouts. Real KGP Google sign-in on a phone hasn't been re-verified after this change (only the frame around `/signin` changed). |
| Product demonstration and judge experience | 10 | 9 | The guided demo embeds the real app and tracks progress. The demo resumes the last sandbox, and Start over gives a fresh one. |
| Responsive design and accessibility | 5 | 4 | Five widths checked, contrast computed, skip links, `aria-current`, labelled menus, 44px targets. No screen-reader pass. |
| Consistency and attention to detail | 5 | 4 | Shared container and type scale across pages. Small inconsistency: the trip composer still says "Message the room". |
| **Total** | **100** | **88** | |

**Result: 88/100, two points under the 90 target.** The remaining gaps need things only you can supply:
1. **Demo video:** embed it on the home page and in the PDF once it's recorded.
2. **Traction:** Live numbers and the 20% business criterion only improve with a real launch.
3. **Human checks:** a phone sign-in test and a screen-reader pass.

## 5. Remaining limitations

- Presence (plan code 34307) and typing indicators (a direct-channel-only API) are not shown; this is explained on `/built-on-nexconn`.
- Other trip members see a captain summary only when they next open the trip (server stream messages aren't pushed live to web clients).
- The demo is a per-browser sandbox; seeing two people in one room needs two real KGP accounts.
- No in-app account deletion; Privacy explains how to request it.
