# Stage Web Broker Readiness Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop by making the local Realtime broker visible to Stage Web without opening a live voice session or sending microphone audio.

## What Was Attempted

- Added a browser-safe Realtime broker readiness contract in `voice-core`.
- Added a GET readiness response and local CORS preflight support to `apps/stage-broker`.
- Added a Stage Web readiness client controlled by `VITE_BLACKSTAGE_REALTIME_BROKER_URL`.
- Added a compact `Realtime edge` status to the Stage Shell; default remains `simulation`.
- Kept the readiness probe GET-only with no audio, no SDP offer, no safety identifier, and no standard API key exposure.

## What Codex Did Well

- Kept the provider bridge visible while preserving the stage event and approval thesis.
- Treated `gpt-realtime-2`, Codex, and Symphony as background infrastructure, not the UI metaphor.
- Caught a real layering bug where the living field could intercept the lower voice/text controls after adding the status row.

## What Needed Correction

- The broker readiness client needed explicit local CORS support to be useful from the Vite Stage Web origin.
- E2e needed the intent capture layer above the workspace so voice/text controls remain clickable.

## Product Insight

The Stage can show whether the live voice edge is available without becoming technical or noisy. `simulation` should stay the default word until a live SDP exchange is explicitly configured.

## AI-Building Insight

Even a tiny visible status can change hit testing in a cinematic layout. Browser proof caught the overlap before it became a demo bug.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 17 Realtime subtests.
- `pnpm --filter @blackstage/stage-broker test`: passed with 5 local server subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 17 `voice-core`, 4 `memory-core`, 13 `agent-runtime`, and 5 `stage-broker` subtests.
- `pnpm build`: passed.
- Targeted failed e2e rerun: passed 3 browser tests.
- `pnpm test:e2e`: passed with 9 browser tests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 173 tracked files after final staging.
