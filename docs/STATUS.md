# Hop — status

**Prod URL:** https://hop-kgp.vercel.app (Vercel project `hop-kgp`, root `web`, region bom1). Currently serves the Task 1 placeholder; the real app is built locally and deploys once env vars exist.

## Done (local, committed, 126 tests green)
- Tasks 1–5, 8–11, 17 (code), 18 (server), 15/16 (server): signed Nexconn client, schema + RLS, fare/fit/phone logic, auth, atomic join/leave/lock in Postgres, lobbies/intents, proposals/votes with metadata mirror, idempotent pod setup + Trip Ticket, webhook, stats, peek, demo sandbox.
- UI: design system, landing, home, post-a-trip, lobby, pod, public peek, stats.

## Live on https://hop-kgp.vercel.app (Fri 20 Nov, ~00:30 IST)
- Accounts done: Nexconn app (Singapore), Supabase (Mumbai, Google + anonymous on), Google OAuth client, Vercel env vars. DB migrated.
- **Verified live with Playwright (isolated contexts):** two users exchange messages in a group channel; server-sent custom message with metadata arrives and a later server metadata update fires `onMessageMetadataUpdated` on the other client; "Try the demo" at 390x844 goes landing -> lobby (2 labelled demo travellers + proposal at ₹1,400) -> I'm in (₹934) -> Lock -> pod with Trip Ticket -> demo traveller leaves (re-split ₹1,400, "Meera left" banner) -> chat message sent. 0 console errors. Screenshots in `docs/media/`.

## Day-1 checks
| # | Check | Result |
|---|---|---|
| 2 | Server metadata update reaches other client | PASS |
| 4 | History for a brand-new member | FAIL: new members do not see earlier messages even after the Console pre-join history switch. Mitigated in code: lobby summary returns plans + intents from the DB and the UI merges them. |
| 1 | Plan tier (Pro vs Starter), presence + pre-messaging webhook | PENDING — user to confirm Chat Pro in Console, then set webhook URL `<site>/api/webhooks/nexconn` with `group_channel:pre_messaging` |
| 3 | Group read receipts ("Seen by") | PASS (Bob's message -> "Seen by 1") |
| 5 | Nexconn WebSocket on KGP WiFi | PENDING — user |
| 6 | Real @kgpian Google sign-in | PASS on user's browser after fixing Supabase Google client id/secret (iOS/Android still to confirm) |

## Three-user journey verified live (paired guest sessions)
Alice posts trip -> proposes (hit + fixed a dead end: profile required) -> Carol joins late and sees plan + intents (after DB-backed fix) -> Carol votes, Alice's page updates to 2 in live -> Alice locks -> pod ticket ₹1,400 -> Bob takes a free seat after lock -> ticket re-splits to ₹934 on both pages with a "joined" banner -> chat + "Seen by 1".

## Next
- Two-real-user pod test (read receipts, join-free-seat, leave re-split) using paired demo sessions.
- Delete `/gallery` and `/dev`, remove DEV_ROOM_ENABLED, README + SDK feature map, P0 gate review, then soft launch.
- Note: my sandbox cannot reach api.sg-light-api.com directly; Vercel can.

## Decisions
- pnpm 12 blocks unapproved build scripts: `esbuild: true` in `web/pnpm-workspace.yaml`.
- Webhook runs on the Node runtime (Edge is rejected with Cache Components); handler is DB-free.
- Atkinson Hyperlegible + Barlow Condensed, station-signage palette (navy / signal yellow / go green), light + dark.
- Temporary: `/gallery` (UI fixtures) and `/dev` (SDK check room) — delete before submission.
