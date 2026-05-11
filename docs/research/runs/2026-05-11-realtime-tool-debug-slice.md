# Realtime Tool And Debug Slice

Date: 2026-05-11

## What Was Attempted

Make the live Realtime path more useful for founder testing by proving provider
tool/function calling reaches the Stage approval surface and by capturing a
redacted live debug packet for latency/event review.

## Prompt Given To Codex

Continue the Blackstage goal after the founder said live voice feedback can
happen manually, but the important near-term priorities are live interaction
tool/function calling and rendering quality.

## What Codex Did Well

- Added an explicit `gpt-realtime-whisper` input-transcription config to the
  trusted server Realtime session descriptor.
- Added hidden Stage Web Realtime debug capture that stores redacted
  client/server event types, timing, tool names, and text lengths without raw
  payloads.
- Added a live UI smoke tool probe that asks the provider for
  `blackstage_prepare_external_action`.
- Kept tool execution approval-gated: the live provider tool call becomes a
  Stage approval card instead of executing automatically.
- Extended redacted smoke proof metadata with a debug summary.
- Ran the armed UI smoke successfully with provider text and provider tool-call
  approval proof.

## What Failed Or Needed Human Intervention

No human intervention was needed. The live smoke stayed microphone-free and used
one explicitly armed local Realtime session.

## Product Insight

Live voice testing should generate reviewable traces without adding visible
dashboard clutter. The right first tool-calling proof is not external execution;
it is provider intent becoming a beautiful approval object.

## AI-Building Insight

Debug packets should be typed, redacted, and local. Event types, timing, and
tool names are enough to diagnose latency and routing without storing raw
transcripts, raw tool arguments, approval tokens, SDP, or provider credentials.

## Evidence

- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `scripts/smoke-realtime-ui-live.mjs`
- `scripts/realtime-live-smoke-proof.mjs`
- `packages/voice-core/src/realtime/realtimeVoiceSession.ts`
- `packages/voice-core/src/realtime/realtimeVoiceServerBroker.ts`
- `apps/stage-broker/test/stageBrokerServer.test.mjs`
- `packages/voice-core/test/realtimeVoiceSession.test.mjs`
- `.blackstage/realtime-smoke/live-2026-05-11T22-10-12-071Z.json` (ignored,
  redacted proof)
- `.blackstage/realtime-smoke/ui-live-2026-05-11T22-10-17-141Z.png` (ignored
  screenshot)
