# Armed Realtime No-Mic Smoke Slice

Date: 2026-05-11

## What Was Attempted

Run the first explicitly armed OpenAI Realtime SDP smoke through the local broker while keeping the browser credential-free and microphone-free.

## Prompt Given To Codex

Continue the active Blackstage goal loop, use the local OpenAI key carefully, keep testing cheap, and move the Realtime voice edge toward a real local proof.

## What Codex Did Well

- Ran redacted preflight before any live provider call.
- Kept live arming shell-only and kept `.env.local` from arming paid work by itself.
- Captured safe upstream diagnostics after early HTTP 400 failures without printing raw SDP, API keys, or approval tokens.
- Learned that OpenAI requires an audio media section in the WebRTC offer, then changed the smoke to use `recvonly` audio with no microphone track.
- Removed unsupported `session.metadata` from the live Realtime request.
- Produced a passing armed smoke proof with one provider request max, 15-second timeout, no browser API key, no browser audio send, `recvonly` audio, and an events data channel.

## What Failed Or Needed Human Intervention

No human intervention was needed. Several guarded live attempts failed before the final pass, but each attempt remained capped, redacted, and microphone-free.

## Product Insight

The Realtime edge can be real without becoming unsafe by default. The right contract is not "no audio section"; it is "no microphone track and no browser audio send until the stage approves it."

## AI-Building Insight

Provider-facing smoke tests need redacted but actionable error detail. A generic 503 was too opaque; safe upstream status and sanitized error fields made the next fix obvious.

## Evidence

- `scripts/smoke-realtime-live.mjs`
- `scripts/realtime-live-smoke-cheap-guard.mjs`
- `scripts/realtime-live-smoke-proof.mjs`
- `apps/stage-broker/src/openAiRealtimeExchange.ts`
- `packages/voice-core/src/realtime/realtimeVoiceBrokerRoute.ts`
- `packages/voice-core/src/realtime/realtimeVoiceServerBroker.ts`
- `.blackstage/realtime-smoke/live-20260511T181039Z.json` (ignored local proof)
