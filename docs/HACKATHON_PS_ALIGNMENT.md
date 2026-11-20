# Hop: hackathon problem-statement alignment

Written Sat 21 Nov 2026, before the website redesign. The source of truth is [`docs/HACKATHON_BRIEF.md`](HACKATHON_BRIEF.md), which transcribes every page of https://reskilll.com/hack/nexconn and its `/rules`. Nothing here adds rules that the brief does not state.

## 1. Official problem statement, summarised

The Nexconn Build Challenge 2026 is an open hackathon with suggested tracks. It asks for an app that **uses the Nexconn Chat SDK with real, measurable usage** and solves a **real communication problem** or adds a **new, interesting interaction**. Platforms are Web, iOS, Android or Flutter. Hop competes in **Social & Community** (group messaging and topic channels). There are five overall winners, with no per-track prizes.

**Our problem statement:** at the end of every semester, IIT Kharagpur students hunt for people to share a cab or toto to Howrah, Kolkata airport (CCU), Santragachi or Kharagpur station.
- It happens in hall WhatsApp groups, where posts get buried, phone numbers are exposed to hundreds of strangers, and nobody knows who has actually committed.
- The people affected are about 16,000 KGP students, and the problem repeats several times a year (vacations, festivals, end-sems).
- Hop turns that scramble into rooms that form around a destination and day, and **end in a decision**: one plan is proposed, joined, locked, and its fare split.

## 2. Mandatory deliverables and evaluation criteria

| # | Deliverable (brief §1 "What to submit") | Mandatory? |
|---|---|---|
| D1 | Write-up PDF: why, the problem, the Nexconn features used, and **the App Key** | Yes |
| D2 | Demo video (YouTube, Vimeo, Loom or Drive), viewable by link, showing the main features working | Yes |
| D3 | Runnable app: a live URL | Yes |
| D4 | Public GitHub repo | Yes |
| D5 | Traction proof (App Key MAU, analytics, feedback) | Bonus, described as "significant" |
| R1 | Uses the Chat SDK with real, measurable usage (no SDK means disqualification) | Hard rule |
| R2 | The same App Key is in the PDF, the form and production | Hard rule (brief §2 Plans) |
| R3 | No fake or seeded MAU; demo accounts labelled | Hard rule (brief §1 implications) |

| Weight | Criterion | What judges look for |
|---:|---|---|
| 50% | Completeness & UX | The demo works start to end, the interface is clean, and the interaction is clear |
| 30% | Innovation & scenario value | A real communication problem, or a new interaction |
| 20% | Business & growth | Traction (active users on the App Key) and viability |

**Presentation constraint (new, from prompt 3):** judges will first open the live URL on a **laptop**. Today the product is a 448px-wide phone column, so on a 1440px screen it looks like a small app sitting in the middle of the browser.

## 3. Traceability matrix

| PS requirement | Existing implementation | Evidence | Gap | Status | Recommended action |
|---|---|---|---|---|---|
| R1 Chat SDK used, measurably | Group channels, custom messages (`Hop:Intent`, `Hop:Proposal`, `Hop:Ticket`), message metadata (live votes), read receipts, history, connection and kick handling, `RC:StreamMsg` captain, pre-messaging webhook | Verified live on 20 Nov (STATUS.md). README SDK table with file references. | Presence is wired but disabled by the plan (34307). **Typing indicators and @mentions** (named in the brief) are not built. The README table omits the stream captain. | Partially satisfied | P1: add typing indicators (cheap, visible). P1: add a `/built-on-nexconn` page plus a README row for streaming. P2: @mention nudge. |
| R2 One App Key everywhere | One app, Chat Pro, used in production | Vercel env, Console | The key isn't in a PDF or form yet | Not yet demonstrated | P0: put it in the PDF and the form |
| R3 No fake MAU, demo labelled | `is_demo` flag, `demo…` IDs, excluded from `/stats` | Tests (demo isolation), `/stats` | Judges counting MAU on the App Key will see demo guests too | Satisfied, needs a disclosure | P0: the write-up and Built-on-Nexconn page explain the `demo` ID prefix |
| D1 Write-up PDF | Not started | — | Missing | Not implemented | **P0** |
| D2 Demo video | Not started | — | Missing; only the user can record it | Not implemented | **P0**: I write the script and shot list, the user records |
| D3 Live URL | https://hop-kgp.vercel.app | 200 on every route, demo in three taps | **On a laptop it reads as a phone app in a box**, and the story of what it is and why sits below the fold | Implemented but insufficiently demonstrated | **P0 (this redesign)**: website-first public surface, a judge demo page, and desktop layouts for the room and the trip |
| D4 Public GitHub repo | Local git with a clean gitleaks history | `git log` | **No public remote** | Not implemented | **P0**: create and push (with the user's OK) |
| D5 Traction | `/stats` live, landing counter hidden under 10 | `/api/stats`: 2 students, 0 trips locked | The launch hasn't happened. The 20% criterion is near zero. | Not implemented | **P0**: launch today. Website "Share Hop" kit (QR, message); in-app feedback already exists. |
| 50% "works start to end" | Full loop verified on production with demo and paired guests | STATUS.md; design-audit score 92/100 | Real-phone iOS and Android plus KGP WiFi are unverified. Lighthouse not run. | Implemented, partly unverified | P0: user phone test. P1: Lighthouse. |
| 50% "clean, clear interface" | Carriage theme, app shell | Design audit | Laptop experience (see D3) | Partial | P0: redesign |
| 30% real communication problem | WhatsApp scramble → rooms that end in a decision | Landing copy | The problem isn't shown visually. The judge has to imagine the WhatsApp mess. | Implemented, under-demonstrated | P0: home "Problem" section with an illustrative, clearly labelled before/after |
| 30% new interaction | Self-forming rooms, plan/vote/lock cards, live fare re-split, streaming AI captain, number-blocking webhook | Live | Scattered across the app; nothing shows them side by side | Implemented, under-demonstrated | P0: "How it works" page with real components, plus a judge demo path |
| 20% viability | Generalises to any campus; free up to 10K MAU | Brief §3 | Nowhere on the site or in the repo | Not demonstrated | P1: short "Beyond KGP" section (market, model, cost), labelled as a plan, not a result |
| Safety (brief innovation hook) | Server-side KGP-only sign-in, numbers only after lock, webhook blocking | Tests, live | No report or block | Partial | P2: report a member (email-based) |

## 4. Current alignment assessment

| Criterion | Weight | Today (1–10) | Why |
|---|---:|---:|---|
| Completeness & UX | 50 | 7 | The product works end to end, but on a laptop it looks like a phone app in a box, and real-phone checks are pending |
| Innovation & scenario value | 30 | 7 | Strong interactions, but a judge has to discover them; the problem isn't dramatised |
| Business & growth | 20 | 2 | 2 real users, no launch yet, viability not written down |
| **Weighted** | | **5.9 / 10** | |

**Alignment score: 52 / 100.** Hard gates D1, D2 and D4 are unmet, so as of today the submission could not be judged at all. The score is not inflated for how the UI looks.

## 5. Missing or weak areas, ranked

1. **The submission can't be judged yet:** no PDF, video or public repo (D1, D2, D4).
2. **Traction is near zero.** The 20% criterion and the "significant bonus" depend on a launch today.
3. **The laptop first impression:** the website doesn't explain itself the way a judge needs, and the app is a phone column.
4. **Innovation is under-demonstrated:** vote, lock, re-split and the captain are only seen if a judge finds them.
5. **SDK depth isn't presented**, and two brief-named features (typing indicators, @mentions) are missing.

## 6. Prioritised recommendations

**P0: mandatory for alignment**
- Public GitHub repo (needs the user's OK to publish).
- Write-up PDF with the App Key, generated from the new site's content plus screenshots.
- Demo video script and shot list for the user to record.
- **Website-first redesign** (this document set): home, how it works, built on Nexconn, judge demo, desktop layouts for the room and the trip.
- Launch kit and the launch itself (user).

**P1: high impact**
- Typing indicators in the room and trip chats (SDK depth, liveliness).
- Lighthouse pass on the new public pages.
- "Beyond KGP" viability section.

**P2: optional**
- @mention nudge, report a member, Call SDK.

## 7. How the redesigned website will communicate the solution

| Judge question | Where it's answered |
|---|---|
| What problem? Who? | Home hero and the "The scramble" section (illustrative WhatsApp-style thread, labelled "Illustration") |
| What's the solution, and how does it work? | Home journey strip; `/how-it-works` uses the real components (plan card, ticket, captain) with sample data |
| What's innovative? | `/how-it-works` and the home "What's new here" list: self-forming rooms, plans with votes, lock-and-split, number shield, streaming captain |
| How is Nexconn used? | `/built-on-nexconn`: architecture diagram, SDK feature table with file links, "where to see it" for each feature |
| Does it work? Let me try. | `/demo`: guided judge walkthrough, with the real product running on the same page (desktop) or full screen (phone) |
| Is anyone using it? Could it be a business? | `/stats`: live real numbers (demo excluded) plus "Beyond KGP", clearly labelled as a plan |

The final alignment score will be recalculated after implementation. D1, D2 and D4 remain open until they actually exist.

## 8. Re-score after implementation (Sat 21 Nov, ~03:00 IST)

| Requirement | Status now | Evidence |
|---|---|---|
| D1 Write-up PDF with App Key | **Done** (6 pages; regenerate with the video link) | `submission/Hop-writeup.pdf` (git-ignored; built by `submission/build-writeup.mjs` from live data) |
| D2 Demo video | **Not done (user)** | Script: `docs/DEMO_VIDEO_SCRIPT.md` |
| D3 Live URL, laptop-first | **Done** | Website plus `/demo`; see `docs/WEBSITE_REVIEW.md` |
| D4 Public GitHub repo | **Done** | https://github.com/varad-oss/hop-kgp (history scanned; a fake fixture key was rewritten out) |
| D5 Traction | **Not done (launch pending)** | `/stats`: 2 students, 0 locked trips |
| R1 SDK depth, demonstrated | **Done** | `/built-on-nexconn` table with code links. Typing status is not available for group channels in the Web SDK, so it was deliberately not faked. |

| Criterion | Weight | Before | Now | Why |
|---|---:|---:|---:|---|
| Completeness & UX | 50 | 7 | 8.5 | Laptop-first site, guided demo with the live app, two-pane desktop room and trip, clipped-fare bug fixed |
| Innovation & scenario value | 30 | 7 | 8 | The problem is dramatised; the five interactions are explained and demonstrable in a minute |
| Business & growth | 20 | 2 | 3 | Viability is written up (labelled as a plan). Traction is still 2 users |
| **Weighted** | | **5.9** | **7.45 / 10** | |

**Alignment score: 70 / 100.** It is capped by D2 (video, required) and D5 (traction). Both depend on the user: recording the video and launching on campus today.
