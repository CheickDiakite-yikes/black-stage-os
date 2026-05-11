# Realtime Debug Latency Markers Slice

Date: 2026-05-11

## What Was Attempted

Make the live Realtime debug export more useful for founder-run voice testing by
recording redacted first-latency markers for the session.

## Prompt Given To Codex

Continue toward live voice testing where the founder can report on tools,
latency, response, audio, and rendering after a real session.

## What Codex Did Well

- Added redacted debug markers for bridge status, data-channel open, and local
  audio handoff state.
- Added summary latency fields for bridge connected, data-channel open,
  microphone readiness/failure, speech input, assistant text/audio, first tool
  call, and returned tool output.
- Kept the markers inside the existing Research Trace/export surface rather than
  creating a developer dashboard.
- Extended the Realtime browser test to assert latency markers are exported and
  raw payloads are still absent.

## What Failed Or Needed Human Intervention

No human intervention was needed. Human microphone testing is still the next
product validation step.

## Product Insight

Latency evidence should help interpret the magic without becoming the magic. A
compact black-box recorder fits Blackstage better than visible developer chrome.

## AI-Building Insight

The next useful live feedback packet needs both objective timing markers and a
subjective rendering note. Tool-call success alone is not enough if the stage
does not feel calm under real voice use.

## Evidence

- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/src/components/ResearchCapture.tsx`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `docs/23_realtime_live_smoke.md`
- `docs/27_live_voice_test_protocol.md`
