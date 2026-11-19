# Hop — status

**Prod URL:** https://hop-kgp.vercel.app (Vercel project `hop-kgp`, root `web`, region bom1). Currently serves the Task 1 placeholder; the real app is built locally and deploys once env vars exist.

## Done (local, committed, 126 tests green)
- Tasks 1–5, 8–11, 17 (code), 18 (server), 15/16 (server): signed Nexconn client, schema + RLS, fare/fit/phone logic, auth, atomic join/leave/lock in Postgres, lobbies/intents, proposals/votes with metadata mirror, idempotent pod setup + Trip Ticket, webhook, stats, peek, demo sandbox.
- UI: design system, landing, home, post-a-trip, lobby, pod, public peek, stats.

## Blocked on accounts (Tasks 6–7 live checks, Task 5 manual check)
1. Nexconn app (hackathon link, Singapore) → App Key + Secret in `web/.env.local` and Vercel env.
2. Supabase project (Mumbai) with Google + Anonymous sign-in → URL, anon key, transaction-pooler `DATABASE_URL`.
3. Google OAuth client.
4. Then: `pnpm db:migrate`, deploy, run day-1 checks (below).

## Day-1 checks
(pending — Task 7)

## Decisions
- pnpm 12 blocks unapproved build scripts: `esbuild: true` in `web/pnpm-workspace.yaml`.
- Webhook runs on the Node runtime (Edge is rejected with Cache Components); handler is DB-free.
- Atkinson Hyperlegible + Barlow Condensed, station-signage palette (navy / signal yellow / go green), light + dark.
- Temporary: `/gallery` (UI fixtures) and `/dev` (SDK check room) — delete before submission.
