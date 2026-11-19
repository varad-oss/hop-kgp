# Design gate review: Hop

**Date:** 2026-11-19 · **Gate:** design · **Reviewed:** `docs/superpowers/specs/2026-11-19-hop-design.md` (and the research report it links to)
**Reviewer stance:** a Nexconn product judge who opens the live URL cold, without a KGP account. The scores are for the design as written, not for what it could become.

## Verdict

**Fails the bar. Weighted 5.8 against a bar of 8.5, with two criteria below 7.** The core loop is well chosen and well specified, with a server-authoritative atomic lock and day-1 checks. But as written, **the people who score the app cannot get in**, and even a signed-in visitor on their own can never reach the lock. Both are cheap to fix. The rest of the gap is traction evidence that sits in P1, and a group decision loop with no way of bringing people back to it.

## Scores (Judge Rubric 6.3)

| Criterion | Weight | Score | Weighted | One-line reason |
|---|---|---|---|---|
| Completeness & UX | 50% | **5** | 2.50 | The loop and its states are solid, but sign-in is `@kgpian`-only, so a judge is stopped on screen one. A lone user can't lock (≥2 needed). Checks 3, 5 and 6 have no fallback. There's no plan to meet the 30-second, accessibility or Lighthouse targets. Without the lockout this would be a 7. |
| Innovation & scenario | 30% | **7** | 2.10 | Lock → private pod → phone reveal → split is a real, legible state change, and two of the rubric's example interactions are in P0. Three things hold it back. The lobby is a chat stream of cards, so intents get buried just as they do in WhatsApp. The one feature nobody else has, the luggage fit badge, has no rule. The AI captain is P1. |
| Business & growth | 20% | **6** | 1.20 | The timing and the reachable audience are the best in the field, and there's a firm no-fake-users stance. But the stats page, feedback quotes and the Dec/Jan retention rooms are all P1, even though §3 lists the "Active users + proof link" as a submission requirement. The doc has no monetization or market section, and the only growth loop is a generic share link. |
| **Total** | | | **5.80** | Bar is 8.5, none below 7 → **not met** |

## Disqualification gate (6.2)

| Item | Status | Note |
|---|---|---|
| Chat SDK visibly and measurably used; same App Key in production | ✅ low risk | Covers connect, group channels, custom messages, metadata, receipts and mentions. One app per org means dev testing also lands on the production key, so the builder should test only as `demo_` users. |
| App Key in PDF + form; App Secret nowhere public | ⚠️ not planned | The design keeps the App Secret server-side. It should say the same for the Supabase service-role key, the Google client secret and the Gemini key, and add `.gitignore` before the first commit and a repo-wide secret scan to the plan. |
| Live URL works for a brand-new user on mobile Chrome/Safari and desktop | ❌ **at risk** | A judge has no `@kgpian` account, and the design defines no judge or demo path. A lone visitor can't reach lock. If check 5 (campus WiFi) or check 6 (Google `hd`) fails, nothing replaces it. The Google OAuth redirect also needs testing on iOS Safari. |
| Public repo README with setup, architecture, SDK feature list with file refs | ⚠️ not in design | It's missing from the §3 submission list. Cheap to do, but put it in the plan. |
| Demo video, viewable, ~2–3 min, main features working | ⚠️ at risk | Showing a 3-person lock means three signed-in phones. A solo builder has one `@kgpian` account, and the design gives `demo_` accounts no way to sign in. Fix 1 below solves this. |
| Write-up states new vs pre-existing | ✅ | Everything is new. |
| No fake users or seeded MAU; demo accounts labelled | ✅ with caveat | The anti-goal is explicit. Fix 1 adds demo co-travellers, so they must be server-only (they never connect the client SDK, so they add zero MAU), carry a "Demo" label on every card, and stay in sandbox lobbies. |

## The 3 weakest items and the smallest fix for each

### 1. A judge can't sign in, and one person can't reach the lock (Completeness 50% + gate)
**Problem.** Google sign-in is restricted to `@kgpian.iitkgp.ac.in`. Nexconn judges will hit a wall on the first screen. Even with an account, the hero needs ≥2 people "in", so anyone testing alone sees a lobby and nothing more. Today the hero is unreachable by the people who score it, and the builder has no defined way to record a multi-person demo.

**Smallest change.** Add a **"Try the demo"** button on the sign-in screen.
- It mints a fresh `demo_<random>` user and a private sandbox lobby (`is_demo = true`), for example "Demo · Howrah · tomorrow".
- The lobby is pre-filled with two labelled, server-only demo travellers and one open proposal that already has one of them "in".
- The judge taps "I'm in", then Lock, and lands in a pod with a Trip Ticket. Demo phone numbers show as placeholders. A "Demo traveller leaves" control triggers the re-split.

The isolation rule is one boolean that every lobby query and the stats filter respect. Demo users never see real lobbies, and real users never see demo ones. Document this path in the README and the write-up, and record the video with it plus real phones.

**Cost.** About 3–4 h. It replaces the undefined `demo_` sign-in path the design already implies.

**Gain.** Completeness 5 → 7, and the gate's live-URL and video items go green. This is the highest-leverage change in the review.

### 2. The decision loop has no way to bring people back, and the proposal card doesn't sell (Completeness with real users + Innovation)
**Problem.** Web gets no push. A proposal posted at 10 PM collects votes only when people happen to reopen the app, so real trips stall and the lobbies a judge sees look quiet. The lobby is also a chat stream of intent cards, which reproduces the "buried posts" problem the intent section attacks. Nothing in the design gives a member a reason to pull one more person in.

**Smallest change.** Make the proposal card the unit you share.
- Show the **live per-head fare** on the card as votes arrive, with the price if one more person joins. For example: "3 in · ₹934 each · 1 seat left → ₹700 each".
- Point the P0 share action at **that card**. Use the Web Share API, falling back to `wa.me/?text=…`, with a deep link to `/p/<id>`. This replaces the generic "share-lobby link", so WhatsApp becomes your notification layer at no infrastructure cost.
- Pin a DB-driven header above the lobby chat, for example "14 going · 6–9 AM: 5 · 2 open proposals". This is a layout change, not a new feature.
- Optional, about 20 min: an "Add to calendar" `.ics` on the Trip Ticket, which stands in for the reminders Web can't push.

**Cost.** About 2 h.

**Gain.** Innovation 7 → 8, because a fare that falls on screen as people join is a new, instantly legible interaction and answers "better than WhatsApp". Business +0.5 from a built-in reason to share. Completeness benefits because real lobbies actually reach locks.

### 3. The traction evidence is P1 (Business 20%)
**Problem.** §3 says the submission needs an "Active users" figure and a proof link, yet the stats page is P1. So are the two-question feedback (your only source of user quotes) and the December/January rooms (your only retention signal). If Saturday runs long, the 20% criterion is left with a bare MAU number. The doc also has no business model, although the research report already has a good one.

**Smallest change.**
- Move the **stats page** (`/api/stats` already exists in the route list) and the **two-question post-lock feedback** into P0.
- Pay for them by demoting **confirm + the @mention nudge** to P1. Pod read receipts already show "seen by 2/3", and once the pod locks, members have each other's numbers.
- After lock, add a one-line prompt: "Coming back 1–3 Jan? Post your return trip." Lobbies are created for any date, so this retention signal is close to free as long as the date picker isn't capped at November.
- Paste five lines of business model into the design: agency referral on guaranteed-full cabs, a Gymkhana or institute safety licence, and the "chat that ends in a binding decision" pattern beyond cabs. Define "₹ saved" as solo fare minus share.

**Cost.** About 2–3 h net of the cuts.

**Gain.** Business 6 → 7.5. The write-up gets a live curve, named quotes and forward bookings instead of a single number.

## Other findings (smaller, fix while building)

- **The 30-second target is unmeasured and likely missed.** Many phones are signed in to a personal Gmail, so sign-in becomes a full `@kgpian` login with 2FA. Profile setup and a four-field intent form come after that. To fix it:
  - Have the shared link pre-fill destination and day.
  - Ask for hall at the same moment as phone (first "I'm in").
  - Make the intent form time-window chips plus a bags stepper that defaults to 1.
  - Count the intent card landing in the lobby as the "first message", and log link-open → intent-sent so the write-up can prove the number.
- **The lock spans two systems.** The Postgres transaction is atomic, but creating the pod channel, joining members, sending the ticket and flipping the proposal metadata are not. A partial failure leaves a "locked" trip with no pod, possibly while a judge is watching. Commit the DB first, then run an idempotent "materialize pod" step that retries when the page is reopened, and show a "Setting up your pod…" state.
- **A two-person lock strands seats.** The roster freezes, and "reopen a seat" is P1, so two people can lock a 4-seat sedan at ₹1,400 each and nobody else can join. Consider letting a locked pod with free seats keep taking "I'm in" until departure. It reuses the leave → re-split path and replaces the P1 "reopen a seat after a drop" item. It also gives the demo a second strong moment: the fare drops in front of everyone.
- **Missing fallbacks:**
  - Check 5 (campus WiFi): detect a connect failure and show "Campus WiFi may block chat; switch to mobile data". This is the only option that fits in 72 h.
  - Check 3 (group receipts): drop "seen by" and keep confirm.
  - Check 6 (Google `hd`): no fallback is defined.
- **The pre-messaging webhook fails open after 5 s.** A cold-started serverless function could let a phone number through. Keep the webhook to a regex on the Edge runtime, and ship the client-side guard as well, not only as a fallback.
- **PWA.** A caching service worker during rapid redeploys will serve stale bundles to real users. Ship the manifest with a network-first service worker or none at all.
- **Performance and accessibility aren't in the design.** Lazy-load `@nexconn/*` after sign-in, keep the landing page static, and write 44 px tap targets and AA contrast into the component rules from the start. That's how you get Lighthouse mobile to 90 or more.
- **The fit badge needs a rule.** Something like: sum of the voted-in members' bags vs the vehicle's bag capacity → "Fits" / "Tight" / "Needs SUV · ₹X each". It's the one thing the research found no competitor models, and right now it's a single phrase.

## Projected score after fixes 1–3

| Criterion | Now | After | Weighted after |
|---|---|---|---|
| Completeness & UX | 5 | 8 (if executed cleanly) | 4.00 |
| Innovation & scenario | 7 | 8 | 2.40 |
| Business & growth | 6 | 7.5 | 1.50 |
| **Total** | **5.8** | | **≈7.9** |

That's about 7.9 on paper. Reaching 8.5 also needs a near-flawless build (Completeness 9) and real KGP numbers that put Business at 8 or above. Those are execution problems, not design problems, so stop designing once fixes 1–3 are in the doc.
