# Codex Live Approval Token Slice

Date: 2026-05-10

## Why this slice

The local runner had a disabled-by-default Codex subprocess boundary, but a single enabled env flag could still arm `run-next`. This slice adds a second local approval gesture before any live-mode Codex worker can be scheduled.

## Prompt

Continue the active Blackstage goal loop and make the background agentic harness safer as it moves toward live Codex execution.

## What changed

- Added `BLACKSTAGE_CODEX_RUN_APPROVAL_TOKEN` as a required live-mode runner secret.
- Added the matching `x-blackstage-codex-approval` local request header for `POST /api/blackstage/harness/run-next`.
- Kept browser-origin runner mutations blocked.
- Added tests proving denied live-mode requests leave queued work untouched and matching local approval can proceed through an injected dry-run scheduler.

## Validation

- `pnpm --filter @blackstage/stage-runner typecheck`: passed.
- `pnpm --filter @blackstage/stage-runner test`: passed with 13 runner subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm scan:secrets`: passed across 193 tracked files.
- `pnpm test:e2e`: not rerun because this slice only changes the local runner guard and docs.

## Product insight

Live agent labor should feel intentionally armed, not accidentally switched on. The approval token is still technical plumbing, but it preserves the product principle that high-impact actions need a visible human gate.

## AI-building insight

The safest path to real Codex workers is layered: disabled by default, bounded workspace, proof packet, read-only browser surface, and now explicit local run approval before scheduling.
