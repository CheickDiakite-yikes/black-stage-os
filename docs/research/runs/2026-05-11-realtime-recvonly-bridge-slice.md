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
- Retained the connected peer handle in Stage Web so reset/reconfiguration can close the live bridge explicitly.
- Let the startup orb request the live Realtime approval when the broker is ready, keeping the visible startup action singular.
- Parsed Realtime speech-start/speech-stop lifecycle events and verified they surface as visible agent labor.
- Drove a fake Realtime server transcript through the retained data-channel listener and verified it became a normal voice intent run that shaped the Stage Shell plan.
- Drove a fake Realtime assistant text event through the same listener and verified it surfaced in the Stage speech status instead of remaining only in storage.
- Drove a fake Realtime server tool-call event through the same data-channel listener and verified it became a visible pending Stage approval instead of an executed action.
- Verified Realtime error events appear as failed visible labor with sanitized error text.
- Kept approved microphone tracks on the explicit approval path instead of adding a transceiver there.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice was verified without another live OpenAI call.

## Product Insight

No-mic Realtime is not the same thing as no audio media. The user-facing promise is no microphone send unless approved; the technical bridge still needs a receive-only audio section.

## AI-Building Insight

After a live smoke discovers a provider requirement, the production-adjacent browser path must inherit that exact requirement immediately. Otherwise the smoke is only a side proof, not a real integration hardening step.

Live bridges also need explicit lifetime ownership. A connected status in serializable state is not enough; the browser peer handle needs a ref so the data channel can remain alive and be closed intentionally.

The first useful event-streaming proofs should be small: lifecycle events become visible labor, one server transcript over the data channel becomes a real voice intent run, one assistant text event becomes visible Stage speech, one requested tool call becomes one approval card, and one error becomes a failed agent event. That keeps the live path auditable before richer realtime behaviors are turned on.

The live edge should still enter through the same object the user already understands: the orb. Secondary controls can remain as operator fallbacks, but the startup surface should not split the user's first action.

## Evidence

- `packages/voice-core/src/realtime/realtimeVoiceWebrtcClient.ts`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/src/app/App.tsx`
- `packages/voice-core/test/realtimeVoiceSession.test.mjs`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
