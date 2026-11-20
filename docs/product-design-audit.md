# Hop: product design audit and redesign plan

Written 20 Nov 2026 against `Web design rules.md` (the playbook). This document is the working record for the redesign. Scores are at the end.

## 1. Product model

| Question | Answer |
|---|---|
| Primary user | An IIT Kharagpur student leaving campus for the vacation (24–30 Nov) or returning in January, on their phone, usually on campus WiFi. |
| Primary job | Find KGP students going the same way on the same day, agree on one plan, and split the fare without having to chase people in WhatsApp groups. |
| First value | Seeing how many people are going your way on your day, and the plans already on the table. |
| Core objects | **Trip post** (intent: destination, direction, date, window, bags). **Room** (lobby: destination + direction + date). **Plan** (proposal: time, meeting point, vehicle, fare, seats, people in). **Trip** (pod: a locked plan with a ticket, members, numbers and chat). **Message**. **Captain summary** (AI, streamed). **Profile** (name, hall, phone). |
| Main workflows | 1. Post a trip and land in the room. 2. Join or propose a plan. 3. Lock a plan (once 2+ are in). 4. Coordinate on the day: ticket, numbers, chat, calendar, captain summary. 5. Leave, which re-splits the fare. 6. Find rooms before posting (new). 7. Manage profile and sign out (new). |
| Roles | Student (KGP Google), demo guest (anonymous, sandboxed), proposer (any member), the Hop bot (server). No admins in the product. |
| Constraints | Postgres is the source of truth: join/lock are atomic SQL functions. Nexconn is the live mirror. KGP-only sign-in is enforced on the server. Phone numbers are shared only inside a locked trip. Demo data is isolated (`is_demo`) and excluded from public numbers. The app is web only, with no push notifications. |

## 2. Current route inventory (before)

| Route | What it does | Issues |
|---|---|---|
| `/` | Landing: headline, sample ticket, sign-in and demo buttons, live counter | No header and no sign-in entry for returning users. Nothing explains how it works, what is shared and when, or answers objections. Footer is only two links. |
| `/home` | "Your trips": a flat list of rooms and trips plus "Post another trip", with "Sign out" in the top bar | It is the whole signed-in app. There is no navigation, no sense of what needs attention, no past trips, and a locked trip looks the same as a room. "Sign out" is the only account control. |
| `/new` | Post a trip (direction, destination, day, window, bags) | Solid. Back always goes to `/home`. |
| `/l/[id]` | Room: people, plans, chat, propose | Solid core workflow. Reachable only after posting. |
| `/pod/[id]` | Trip: ticket, numbers, chat, captain, leave | Solid. |
| `/p/[id]` | Public peek of a shared plan | Fine. |
| `/stats` | Public traction numbers | Fine, but no way back into the app. |
| `/privacy`, `/terms` | Legal | Plain. |
| Missing | There is no way to browse rooms before posting, no account page, no help or FAQ, no dedicated sign-in page, and no 404 or error page. | — |

**Navigation:** none. Every page is reached through a link inside another page, so a signed-in user cannot move between areas.

**What works and must be kept:** Google sign-in limited to KGP, the demo sandbox, posting a trip, the room's proposal cards (from the database, mirrored live in Nexconn), atomic join and lock, the trip ticket and fare re-split, read receipts, the captain stream, the phone-number webhook, the ICS file, and the theme tokens.

**Visual weaknesses:** home is a column of identical rounded links. The empty state is the only guidance. Bordered rounded containers are overused. The landing page has no proof of how it works below the sample ticket.

## 3. Research: reference products and patterns

| Reference | Pattern studied | What we adopt | What we do not copy |
|---|---|---|---|
| [BlaBlaCar](https://apps.apple.com/in/app/id341329033) ([flow notes](https://eathealthy365.com/how-does-the-blablacar-service-work/)) | Search by from / to / date, then a list of rides, a ride detail, and a separate "your rides" area | Browsing before committing: a **Departures** board filtered by direction, destination and date. Our trips get their own area. | Driver/passenger roles, per-seat pricing and booking payments. Hop has peers splitting one fare. |
| [Airbnb Trips](https://www.airbnb.com/help/article/4222) | The trips feed shows upcoming first, then past. The next trip is the itinerary hero. | **Trips** home shows the next locked trip as a hero, then what needs action, then upcoming, then recent past. | Maps and upsells. |
| Station departure boards (Indian Railways / airport FIDS) | Time-ordered rows grouped by day, a status column, a scannable destination | The Departures board uses day groups and status words ("Plan locked", "2 plans open", "Gathering"), not cards. | Flip-dot gimmicks. |
| [Splitwise](https://www.splitwise.com/) | "Who owes what" is always in view | The fare each person pays stays on every trip row and ticket. | Debt tracking. Hop splits the fare before the trip, not after. |
| WhatsApp hall groups (the current workaround) | Fast, but plans get buried and numbers are posted publicly | Plans are structured cards, and numbers are shown only after lock. | — |
| [Apple HIG: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Tabs are destinations, not actions | Three tabs (Trips, Departures, Account). "Post a trip" is a page action, not a tab. | — |
| [GOV.UK patterns](https://design-system.service.gov.uk/patterns/) and [NN/g heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Plain question-led forms, error summaries, status visibility | Field-level errors on Account, explicit save states, status words alongside colour. | — |

## 4. Proposed information architecture

| Surface | Status | Reason |
|---|---|---|
| Landing `/` | Required (improved) | Explain value, how it works, what is shared and when, FAQ, footer. |
| Sign in `/signin` | Required (new) | One place for KGP sign-in, wrong-account and failed-return states, and the demo route. `AuthGate` links here with `next`. |
| Onboarding | Useful, kept minimal | The first post-a-trip is the onboarding. The profile (hall and phone) is asked only when it is needed (propose or join), as it is today. |
| **Trips** `/home` | Required (rebuilt) | Orientation: next locked trip, things that need you, upcoming rooms, recent past. |
| **Departures** `/departures` | Required (new) | Browse upcoming real rooms by day, with filters in the URL. Open a room you are in, or post into it with the details prefilled. |
| **Account** `/account` | Required (new) | Profile (name read-only from Google, hall, phone masked and editable), sign-in identity, demo notice, sign out, links to help and legal. |
| Help `/help` | Required (new) | How Hop works, fares and splitting, what is shared and when, safety, FAQ, contact. |
| Post a trip `/new` | Kept | Focused create flow. Back returns to where you came from. |
| Room, trip, peek | Kept | Focused detail views: no tab bar, so the composer has room. |
| Live numbers `/stats` | Kept | Public proof. Linked from the footer and Account. |
| 404 and error pages | Required (new) | Recovery routes. |
| Notifications inbox | Not applicable for now | Web has no push. "Needs you" on Trips covers the actionable events. |
| Teams, roles, billing | Not applicable | There are no organisations and no payments. |

**Shell:** on phones, a bottom tab bar (Trips, Departures, Account) on the three top-level destinations. At 768px and wider, the same items sit in a sticky top header next to the wordmark, and content widens to 48rem. Focused views (room, trip, post, peek) use a back-button top bar and no tabs.

## 5. Module briefs

### Trips (`/home`)
- **Purpose:** know what is next and act on it.
- **Objects:** my trip posts and rooms, my locked trips.
- **Entry:** sign-in return, tab bar, links in the 404 and error pages.
- **Overview, in priority order:**
  1. "Next departure": the soonest live trip, with time, route, fare each, people, and an Open ticket link.
  2. "Needs you": rooms where open plans exist and I am in none ("2 plans waiting, pick one"), plans I am in that can be locked, and plans I am in that are waiting for a second person.
  3. "Upcoming": other rooms and trips.
  4. "Recent": trips from the last 7 days, archived.
- **Act:** open a ticket or room, post a trip. Status words appear with every row.
- **States:** loading skeleton, a new-user empty state that offers both Post a trip and Browse departures, an error with retry, and an offline banner.
- **Data:** `GET /api/me/trips` is extended with per-room counts (going, open plans, my plan state, trip time and fare). Read-only, scoped to the signed-in user.

### Departures (`/departures`)
- **Purpose:** see demand before posting, and find your room.
- **Objects:** upcoming non-demo rooms, today to 31 Jan.
- **Find:** direction (Leaving / Returning), destination, and a day chip row. All filters live in the URL (`?dir=&d=&date=`), so they survive reload and back.
- **Overview:** day-grouped board rows showing destination, going count, open plans, earliest plan time, and status.
- **Inspect and act:** if I am already in the room, the row opens it. Otherwise it opens `/new` with destination, direction and date prefilled. The room's names stay private until you post.
- **Access:** signed-in users only. A demo guest sees the board with a notice and a sign-in call to action instead of posting into real rooms. Demo rooms are never listed.
- **States:** loading, empty ("No one has posted for these filters yet. Be first"), filtered empty with a Clear filters action, error with retry.
- **Data:** a new `GET /api/departures` returns aggregates only (no names). It is rate limited and excludes demo rooms.

### Account (`/account`)
- **Purpose:** control what others see, and leave.
- **Shows:** name, hall and email from Google (read-only). Hall and phone are editable with validation and saving / saved / error states, and the phone is shown masked. For demo guests, it explains the sandbox and offers KGP sign-in.
- **Actions:** save profile, sign out. There are links to Help, Privacy, Terms and Live numbers.
- **Omitted, honestly:** account deletion is not built. Help explains how to ask for deletion by email instead of showing a fake button.

### Help (`/help`)
Static and public. It covers how it works (4 real steps), fares and splitting, what is shared and when, safety and reporting, FAQ, and contact.

### Sign in (`/signin`)
- Shows the KGP Google button, why only KGP, and what Hop stores.
- Covers the wrong-account state (`?notkgp=1`), the failed-return state (`?error=auth`), and the already-signed-in state (Continue to your trips).
- The demo is an alternative route.

## 6. Visual direction (kept, refined)

- **Theme:** the "first-class carriage" theme is kept unchanged (lacquer green, brass, stone; Bodoni Moda for display, Manrope for text).
- **New rule: fewer containers.** Lists are hairline-divided rows inside one surface, not a stack of bordered cards. Cards are reserved for things that act on their own: the ticket, plan cards, the captain.
- **Section headings:** sentence-case Manrope bold, 15px, muted. No uppercase labels.
- **Status:** always a word, sometimes with a colour dot. Never colour alone.
- **Tab bar:** text plus simple line icons drawn inline as SVG, with no icon library. The active tab gets a brass underline bar and `aria-current="page"`.
- **Desktop:** content is capped at 48rem (12px gutters on phone, 24px from tablet up), with the top header holding the tabs.

## 7. Implementation sequence and risks

1. The `AppShell` and its tab bar, plus `not-found` and `error` pages.
2. Trips: API extension (tested), then the UI.
3. Departures: server function (tested) and API, then the UI with URL filters.
4. Account, Help, Sign in. `AuthGate` points to `/signin`.
5. Landing additions and footer.
6. Inspect every route at 375, 430, 768 and 1280px in light and dark, fix, and score.

**Risks:**
- Extra queries on `/home`: kept to two aggregate queries.
- Nothing about Departures is personal: it shows counts only, and posting still goes through the existing flow.
- No changes to auth, join/lock logic, Nexconn or the database schema.
