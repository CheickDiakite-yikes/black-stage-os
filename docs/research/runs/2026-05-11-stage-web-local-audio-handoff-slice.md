# Stage Web Local Audio Handoff Slice

Date: 2026-05-11

## What Was Attempted

Connect the approval-gated WebRTC audio-track contract to Stage Web behind a disabled-by-default local audio flag.

## Prompt Given To Codex

Continue toward the active Blackstage reality-interface goal by advancing native Realtime voice wiring without repeating completed source-policy work or starting unapproved live audio/provider calls.

## What Codex Did Well

- Added a Stage Web local-audio preparation helper that stays disabled unless `blackstage.realtimeAudio.enabled` or `VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED` is set to `1`.
- Required a ready microphone preflight before calling `getUserMedia`.
- Passed approved local audio tracks into the Realtime SDP bridge only after visible Stage approval.
- Added browser proof that the default bridge still makes zero `getUserMedia` calls, while the explicitly armed audio path calls `getUserMedia` once and attaches the fake audio track before SDP exchange.

## What Failed Or Needed Human Intervention

No human intervention was needed. The test used fake browser media and fake WebRTC; no real microphone permission prompt, live OpenAI Realtime session, or provider audio call ran.

## Product Insight

Native voice should have a visible, layered arming path. A disabled local-audio flag lets Blackstage prove the audio handoff without making the ordinary demo unexpectedly ask for microphone access.

## AI-Building Insight

Browser tests should prove both absence and presence. Here the default path proves no capture, while the armed path proves exactly one local capture and an approved audio-track handoff.

## Evidence

- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/src/app/App.tsx`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `docs/22_reality_interface_completion_audit.md`
