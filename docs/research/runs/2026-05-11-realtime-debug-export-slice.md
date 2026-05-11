# Realtime Debug Export Slice

Date: 2026-05-11

## What Was Attempted

Give live voice testers a quiet way to export useful session diagnostics after a
Realtime run without exposing raw provider payloads or audio.

## Prompt Given To Codex

Continue toward a live test after the founder said they can do live voice
testing and want a debug mode for tools, latency, response, and audio.

## What Codex Did Well

- Added a compact Realtime debug block inside the existing Research Trace panel.
- Kept the block invisible until sanitized Realtime debug events exist.
- Summarized event counts, tool count, audio event count, and max elapsed time.
- Added a `blackstage-realtime-debug-*.json` export with redacted events,
  summary booleans, bridge state, and mic preflight state.
- Extended the Realtime browser test to prove the export records tool-call and
  tool-output evidence while omitting raw provider payloads.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice stayed inside the existing trace
surface to avoid adding dashboard clutter.

## Product Insight

The right debug surface for Blackstage is a black-box recorder, not a developer
console. It should be visible only when evidence exists and useful enough to
hand back after a live voice session.

## AI-Building Insight

Live testing will move faster if the UI can export redacted event timing and
tool evidence directly. This creates a feedback loop for latency, tool calling,
audio lifecycle, and response timing without requiring raw transcript capture.

## Evidence

- `apps/stage-web/src/components/ResearchCapture.tsx`
- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/realtime-bridge.spec.ts -g "Stage Web bridges live Realtime SDP"`
