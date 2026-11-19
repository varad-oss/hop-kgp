# Hop — trip rooms that decide (design, short)

**Date:** 2026-11-19 · **Track:** Social & Community · **Builder:** solo · **Deadline:** Sun 22 Nov 2026, 23:59 IST
**Sources:** [hackathon brief](../../HACKATHON_BRIEF.md) · [research report](../../../reports/Nexconn%20hackathon%20concept%20choice.md) · [design-gate review](../../reviews/2026-11-19-design-gate.md)

## 1. Intent

At the end of every semester, IIT Kharagpur students try to find co-passengers to split a ride to Kolkata airport (CCU), Howrah, Santragachi or Kharagpur station. Today that happens in WhatsApp posts ("anyone going to CCU on the 26th?") that get buried, expose phone numbers to strangers, and never make clear who has actually committed.

Hop turns that into a chat that ends in a binding decision:

1. You say where and when you're going, and land in a room with everyone heading the same way that day.
2. Someone proposes a plan, and the per-head fare drops on screen as people tap "I'm in".
3. The group **locks**, and the chat becomes a private trip pod with phone numbers revealed and the fare split.

**Why now:** the official calendar puts end-sems at 16–27 Nov. Students leave after their last paper, so departures peak around 25–29 Nov, inside the judging window (23–27 Nov). Real use during judging is how we score the 20% traction weight. It is also how we earn the 50% "it works" weight, because the app has to survive real users.

## 2. Goals, non-goals, anti-goals

**Goals**
- The core loop works first time on a phone: sign in → post trip → lobby → propose → vote → lock → pod with phone numbers and fare split.
- A KGP student goes from a shared link to their trip card in the lobby in **under 30 seconds**. Measure it by logging link-open → intent-sent.
- **A judge without a KGP account reaches the lock in three taps** ("Try the demo").
- Real KGP users on the single Nexconn App Key. Soft launch Fri 20 Nov, broad launch Sat 21 Nov, and keep pushing through 27 Nov. A live stats page backs the "Active users" figure.
- Deep, nameable Nexconn usage:
  - server-created group channels
  - custom messages and message metadata
  - read receipts
  - presence
  - a pre-messaging webhook
  - (P1) @mentions and streaming messages

**Non-goals:** a ride-hailing marketplace, onboarding drivers or vehicles, payments, native apps, scaling beyond 10K MAU.

**Anti-goals** (failure even if it technically works)
- **Fake traction.** Fake, seeded or bot users must never be counted. Demo users are `demo_`-prefixed, live only in sandbox lobbies, and are excluded from every number we publish. Demo co-travellers are server-only, so they never connect a client and add no MAU.
- **Early phone exposure.** No phone number is visible to anyone before a trip locks.
- **Handling money.** We never hold or move money; fare splits are a ledger only.
- **A generic room-per-trip demo.** The lock and the falling fare are the hero.

## 3. Constraints

**Nexconn**
- Sign up via the hackathon Free Chat Plan link (Growth Credit: 10K MAU, about 500 peak connections).
- One app per org, permanently. Choose the **Singapore** data centre; it can't be changed later.
- Pin `@nexconn/engine` and `@nexconn/chat` at **26.2.1**.
- Build our own UI rather than using ChatUI, which doesn't support portrait mobile or metadata cards.
- No typing indicators in groups (the Web SDK only has them for direct channels), no push on Web, and no Call SDK.
- There is only one key, so all dev testing runs as `demo_` users.

**Identity:** current students have Google-hosted `@kgpian.iitkgp.ac.in` accounts.

**Campus network:** chat apps were reported blocked on KGP WiFi in 2022–23, so test the Nexconn WebSocket on campus WiFi on day 1.

**Secrets**
- Server env only: Nexconn App Secret, Supabase service-role key, Google client secret, Gemini key.
- Add `.gitignore` before the first commit.
- Run a gitleaks pre-commit hook and a repo-wide scan before submitting.

**Submission:**
- live HTTPS URL
- public repo whose README has setup, architecture and an **SDK feature list with file references**
- a 2–3 min demo video
- write-up PDF with the App Key
- "Active users" figure plus a proof link pointing to the live stats page

## 4. Approaches considered

| Decision | Options | Picked | Why |
|---|---|---|---|
| How rooms form | (a) destination × day lobby → private pod on lock · (b) server auto-matches intents into small groups · (c) one open channel per destination | **(a)**, from research | With thin early demand, (b) often shows "no match". Open channels (c) are online-only, have no history, die after 60 min idle and have no metadata. |
| When a trip locks | manual · auto when seats fill · unanimous | **Manual: any voted-in member taps Lock once ≥2 are in** (your pick) | Explicit, with a simple tally. |
| Name | keep · rename | **Keep "Hop"** (your pick) | — |
| AI provider (P1) | OpenAI · Gemini | **Gemini** (your pick) | The key you have. |
| Who writes votes and locks | client `setMetadata` · our server via the Server API | **Server** (my call) | Seat caps and one-vote-per-person need one authority. Client writes to others' messages are undocumented. The DB is the truth; Nexconn metadata is its live mirror. |
| Sign-in | email OTP · Google restricted to `@kgpian` | **Google** (my call, **check**) | One tap, same trust as OTP, and no mail rate limits. If day-1 check 6 fails, fall back to email OTP to `@kgpian` through a custom SMTP sender. |
| Judge / demo access | none · published `demo_` logins · **"Try the demo" sandbox** | **Sandbox** (my call, from review) | Judges can't sign in otherwise, and a lone visitor can't reach lock. The brief allows labelled demo accounts excluded from numbers. |
| Seats after lock | frozen · **stay open until departure** | **Stay open** (my call, **check**) | Avoids a 2-person lock stranding a 4-seat cab at ₹1,400 each. Each join re-splits in front of everyone and reuses the leave path. Numbers still reveal only to members. |
| Stack | Next.js (TS) on Vercel + Supabase (Postgres, Auth) | my call, the brief's default | API routes hold secrets; one deploy target. |

## 5. Design

### Room lifecycle

```
LOBBY "Howrah · Thu 26 Nov"   group channel, server-created on the first intent for that destination+day
  ┌ pinned header (from DB): "14 going · 6–9 AM: 5 · 2 open proposals"   ← not buried in chat
  ├ Intent cards   "Riya · leaving 6–9 AM · 2 bags"
  ├ free-text chat, presence dots; phone numbers blocked
  └ Proposal card  "6:30 AM · Main Building gate · Sedan · ₹2,800"
       "3 in · ₹934 each · 1 seat left → ₹700 each"   (live; capped at seats)
       Fit badge: Fits / Tight / Needs SUV      [I'm in] [Share ↗]
       ≥2 in → [Lock trip] for voted-in members
           │ lock: DB transaction commits first → idempotent "materialize pod" (retries on reopen;
           ▼        UI shows "Setting up your pod…")
POD "Howrah 6:30 AM"   private group channel, members = voted-in users
  ├ Trip Ticket: time, meeting point, vehicle, ₹ each, members' phone numbers, Add to calendar (.ics)
  ├ chat with read receipts ("seen by 2/3")
  ├ free seats: lobby members can still tap "I'm in" until departure → join pod, ticket re-split
  ├ someone leaves → re-split, updated ticket posted
  ├ after lock: 2-question feedback + "Coming back 1–3 Jan? Post your return trip"
  └ archived 24 h after departure
The lobby card flips to "Locked · 3 going · 1 seat open".
```

### Proposal details

- **Fields:** departure time, meeting point (presets plus free text), vehicle, total fare (editable), seats.
- **Vehicle defaults** (editable; **check these local numbers**):

  | Vehicle | Seats | Bag capacity | Fare preset |
  |---|---|---|---|
  | Toto | 4 | 4 | ₹250 per vehicle for the station run (freshers guide: ₹250–300) |
  | Sedan | 4 | 3 large | CCU ₹2,800, the campus agency's fixed non-AC fare |
  | SUV | 6 | 5 large | entered by user |

  Howrah and Santragachi fares are entered by the user.
- **Fit badge:** take the sum of voted-in members' bags.
  - "Fits" if it is at or under capacity.
  - "Tight" if it is capacity + 1.
  - Otherwise "Needs SUV", with the per-head fare when an SUV fare is known.
- **Votes:** one active "I'm in" per user per lobby; voting elsewhere moves the vote (my call).
- **Fare:** equal split, total ÷ members rounded up to the rupee, with the remainder shown. "₹ saved" = solo fare − share.

### Onboarding under 30 seconds

1. A shared link pre-fills destination and day.
2. Google sign-in.
3. Intent form: window chips plus a bags stepper (default 1).
4. The intent card lands in the lobby.

**Hall and phone** are asked only at the first "I'm in" (my call).

A non-`@kgpian` Google account is not rejected outright; it gets "Not a KGP student? Try the demo".

### Sharing (the growth loop)

- The share action on a proposal card uses the Web Share API, falling back to `wa.me/?text=…`. It deep-links to `/p/<id>`.
- The public peek page shows **counts only, no names or halls**, for example "3 in · ₹934 each · 1 seat left · Howrah Thu 26, 6:30 AM", with "Sign in with your KGP Google to join". WhatsApp becomes our notification layer.

### Try the demo (judges, video)

- Mints a `demo_<random>` user and a private sandbox lobby, for example "Demo · Howrah · tomorrow".
- The lobby contains two labelled server-only demo travellers and one open proposal with one of them already in.
- Three taps: I'm in → Lock → pod. Phone numbers show as placeholders. A "Demo traveller leaves" control shows the re-split.
- `is_demo` isolates everything: demo users never see real lobbies, real users never see demo ones, and stats exclude demo.

### Nexconn usage mapped to the loop

| Step | Nexconn feature |
|---|---|
| Connect | Server `POST /v4/auth/access-token/issue` (signed `sha1(AppSecret+Nonce+Timestamp)`). Client: `NCEngine.initialize({appKey, areaCode: SG})` → handlers → `connect`, lazy-loaded after sign-in. |
| Lobby / pod | Server `/v4/group-channel/create` (`joinPerm: 1`) + `/join`; pre-join history on. |
| Cards | Custom types `Hop:Intent`, `Hop:Proposal`, `Hop:Ticket`, registered before `connect` and sent from the server with `hasMetadata: true`. |
| Votes, lock, seats | Message metadata set by the server; clients react on `onMessageMetadataUpdated`. |
| Chat | Text messages, `needReceipt` read-by in pods, online-status subscription. P1: `mentionedInfo` nudge. |
| Phone masking | `group_channel:pre_messaging` webhook as a regex on the Edge runtime (it fails open after 5 s). A client-side guard always ships too. |
| P1 AI captain | Gemini → `/v4/group-channel/message/stream/send` (`RC:StreamMsg`); the client calls `requestStreamMessage()`. |

### Server and data

**Routes:**
- `/api/nexconn/token`
- `/api/intents`
- `/api/proposals`, `/api/proposals/:id/vote`, `/api/proposals/:id/lock`
- `/api/pods/:id/join`, `/api/pods/:id/leave`
- `/api/demo`
- `/api/feedback`
- `/api/webhooks/nexconn`
- `/api/stats`

Every mutation checks the session. The token, intent and demo routes are rate-limited.

**Postgres tables:**
- `users` (email, name, hall, phone, `is_demo`)
- `lobbies` (destination, date, channel id, `is_demo`)
- `intents`
- `proposals` (`open | locked | cancelled`, message uid)
- `votes` (unique per proposal+user)
- `pods` (`pending | live | archived`)
- `pod_members` (`in | left`)
- `feedback`
- `events` (funnel timings)

### Quality rules

- Static landing page.
- 44 px tap targets, AA contrast, Lighthouse mobile ≥ 90.
- A PWA manifest with a network-first service worker, or none, so rapid redeploys never serve stale code.
- If the connection fails, show "Campus WiFi may block chat; switch to mobile data".

### Business model (for the write-up)

1. Referral deals with the campus taxi agency for guaranteed-full cabs.
2. A safety-tool licence to the Gymkhana or the institute.
3. The same engine for any residential campus, event travel or corporate shuttle, free up to 10K MAU on Nexconn.
4. Recurring demand every vacation, with January return trips posted from day 1.
5. The pattern generalizes: a chat that ends in a binding decision.

### Scope

**P0**
- Google sign-in.
- Post trip.
- Lobby with pinned header, intent cards, chat and presence.
- Proposal with live per-head fare, fit badge and votes.
- Lock → pod with Trip Ticket, phone numbers, split and `.ics`.
- Join a free seat; leave → re-split.
- Card share plus public peek page.
- Try-the-demo sandbox.
- Stats page.
- Post-lock feedback and the return-trip prompt.
- Empty, loading, error and reconnect states.

**P1**
- AI captain summary.
- Confirm button plus @mention nudge.
- Women-only lobbies.
- Quick-reply chips.
- UPI pay links.
- Report/block.

**P2 (cut without regret):** Call SDK, translation, desktop ChatUI, flight/train lookup.

## 6. Day-1 checks before building on them

| # | Check | Fallback if it fails |
|---|---|---|
| 1 | Console plan tier, Starter vs Pro (presence, pre-messaging webhook) | Without the webhook: the client guard plus a visible "never share numbers here" rule. |
| 2 | A server-sent custom message with metadata, then a server metadata update → `onMessageMetadataUpdated` fires on another client | Votes become server-sent messages that clients fold into the card. |
| 3 | Read receipts in groups for client-sent messages | Hide "seen by". |
| 4 | Pre-join history setting for lobbies | — |
| 5 | WebSocket on KGP WiFi and mobile data | The connect-failure banner. |
| 6 | Google `hd` claim = `kgpian.iitkgp.ac.in`, OAuth redirect works on iOS Safari, non-kgpian accounts routed to the demo | Email OTP via custom SMTP. |

## 7. Left to the builder

Exact columns, the component breakdown, the rate-limit mechanism, OG images, copy, meeting-point presets, and the test plan. Tests cover only the critical logic: token signing, vote tally and seat cap, lock and materialize idempotency, fare split and re-split, the fit badge rule, and demo isolation.

## 8. What you need to do

- Create the Nexconn app via the hackathon link (Singapore).
- Create a Supabase project.
- Create a Google OAuth client.
- Run `vercel login`.
- Put the keys in `.env.local` yourself, never in chat.
