# Hop — status

**Prod URL:** https://hop-kgp.vercel.app (Vercel project `hop-kgp`, root `web`, region bom1)

## Progress
- Task 1: scaffold, tests, gitleaks hook, first deploy — done 2026-11-19 19:40 IST.

## Day-1 checks
(pending — Task 7)

## Decisions
- pnpm 12 blocks unapproved build scripts: `esbuild: true` in `web/pnpm-workspace.yaml` (needed by tsx/vitest); Vercel installs fail without it.
