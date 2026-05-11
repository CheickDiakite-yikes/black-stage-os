# Realtime Recvonly Bridge Slice

Date: 2026-05-11

## What Was Attempted

Align the Stage Web live Realtime bridge with the passing no-mic smoke offer shape.

## Prompt Given To Codex

Continue the active Blackstage goal from the pushed Realtime smoke/proof state and choose the next concrete action toward real live-session wiring.

## What Codex Did Well

- Found that the Stage Web bridge could still create a data-channel-only offer when microphone audio was disabled.
- Added a required `recvonly` audio transceiver for no-mic SDP offers before creating the data channel.
- Added an early failure path so browsers that cannot create the required audio section fail before a broker/provider request.
- Kept approved microphone tracks on the explicit approval path instead of adding a transceiver there.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice was verified without another live OpenAI call.

## Product Insight

No-mic Realtime is not the same thing as no audio media. The user-facing promise is no microphone send unless approved; the technical bridge still needs a receive-only audio section.

## AI-Building Insight

After a live smoke discovers a provider requirement, the production-adjacent browser path must inherit that exact requirement immediately. Otherwise the smoke is only a side proof, not a real integration hardening step.

## Evidence

- `packages/voice-core/src/realtime/realtimeVoiceWebrtcClient.ts`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `packages/voice-core/test/realtimeVoiceSession.test.mjs`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
