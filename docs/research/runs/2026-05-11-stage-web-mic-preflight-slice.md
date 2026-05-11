# Stage Web Mic Preflight Slice

Date: 2026-05-11

## What Was Attempted

Expose the browser microphone readiness contract inside Stage Web before starting any live Realtime voice capture.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop after the harness source policy checkpoint, with the user pointing toward OpenAI Realtime voice as part of the background agentic harness.

## What Codex Did Well

- Added a Stage Web microphone preflight helper that queries browser capability and permission state without calling `getUserMedia`.
- Rendered the Realtime edge mic gate as visible stage status: gesture, permission, blocked, unavailable, or ready.
- Kept the approved SDP bridge separate from microphone capture.
- Extended the Realtime bridge browser proof to assert `no stream` and zero `getUserMedia` calls.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice did not request microphone permission, start a media stream, or call OpenAI.

## Product Insight

Live voice should become visible in layers: broker, approval, SDP, microphone, then provider audio. Showing the mic gate makes the future live path feel deliberate instead of spooky.

## AI-Building Insight

Browser tests should prove absence as well as presence. Here the important proof is that the live Realtime control path can advance without accidentally starting capture.

## Evidence

- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/realtime-bridge.spec.ts`
- `pnpm --filter @blackstage/stage-web build`
- `pnpm exec prettier --check apps/stage-web/src/app/App.tsx apps/stage-web/src/components/StageShell.tsx apps/stage-web/src/styles/global.css apps/stage-web/src/voice/realtimeMicPreflight.ts apps/stage-web/tests/realtime-bridge.spec.ts`
