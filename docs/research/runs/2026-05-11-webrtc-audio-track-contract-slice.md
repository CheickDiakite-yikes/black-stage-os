# WebRTC Audio Track Contract Slice

Date: 2026-05-11

## What Was Attempted

Move the Realtime voice path one step beyond no-audio SDP by adding an approval-gated WebRTC audio-track attachment contract in `voice-core`.

## Prompt Given To Codex

Continue toward the active Blackstage reality-interface goal without repeating completed harness policy work. Choose the next concrete action toward native voice while preserving approval gates and avoiding unapproved live provider calls.

## What Codex Did Well

- Added an explicit `approvedAudioTrack` path to the Realtime WebRTC client contract.
- Blocked audio-track attachment unless `audioTrackApproved` is true, before peer creation or broker network work.
- Added tests proving approved audio is attached before offer creation and still never exposes a standard OpenAI API key to the browser.

## What Failed Or Needed Human Intervention

No human intervention was needed. No microphone permission prompt, media stream, live OpenAI Realtime call, or provider audio path was started.

## Product Insight

The right path to native voice is staged trust: first broker, then proof, then mic preflight, then an explicit audio-track handoff contract. Each layer should be inspectable before it becomes live.

## AI-Building Insight

Realtime audio should be a typed capability with approval semantics, not an incidental side effect of opening WebRTC. This makes later UI work safer because tests can prove that audio cannot start before the Stage says it can.

## Evidence

- `packages/voice-core/src/realtime/realtimeVoiceWebrtcClient.ts`
- `packages/voice-core/test/realtimeVoiceSession.test.mjs`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `docs/22_reality_interface_completion_audit.md`
