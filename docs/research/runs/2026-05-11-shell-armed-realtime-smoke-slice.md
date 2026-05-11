# Shell-Armed Realtime Smoke Slice

Date: 2026-05-11

## What Was Attempted

Prevent a local env file from accidentally arming a paid OpenAI Realtime smoke call.

## Prompt Given To Codex

Continue the active Blackstage goal loop, use the founder's local OpenAI key carefully, and make sure testing remains cheap.

## What Codex Did Well

- Kept `.env.local` useful for local credentials without letting it arm live smoke by itself.
- Made `pnpm preflight:realtime` distinguish shell-armed live smoke from local-env-only live flags.
- Made `pnpm smoke:realtime` skip live calls unless `BLACKSTAGE_REALTIME_LIVE_SMOKE=1` was present before local env loading.
- Added a regression test proving `.env.local` alone cannot set `okToRun: true`.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live OpenAI call was run.

## Product Insight

The stage should treat paid/external execution as an explicit operator gesture, not as a configuration accident.

## AI-Building Insight

Agentic build loops need source-aware safety gates. It is not enough to know that an env var is set; the system should know whether it came from an intentional shell export or a passive local file.

## Evidence

- `scripts/preflight-realtime-live.mjs`
- `scripts/smoke-realtime-live.mjs`
- `scripts/test/realtime-live-smoke-proof.test.mjs`
