# Realtime Broker Contracts Slice

Date: 2026-05-10
Run type: `/goal` implementation slice

## Prompt

Continue the Blackstage goal loop while incorporating the direction to use the newer OpenAI Realtime voice model, `gpt-realtime-2`, behind safe product boundaries.

## What Was Attempted

- Add a server-mediated Realtime broker contract before any live API integration.
- Keep browser clients away from standard API keys.
- Require a safety identifier for configured live voice sessions.
- Represent the WebRTC data channel and Stage event policy in typed voice-core contracts.

## What Codex Did Well

- Preserved simulation mode as the default.
- Kept `gpt-realtime-2` pinned in the broker plan for this prototype phase.
- Added tests that block live broker readiness when safety metadata is missing.
- Kept assistant speech routed through `assistant.speech` as a stage-owned event.

## What Failed Or Needed Human Intervention

- No live server, SDP exchange, OpenAI session creation, microphone streaming, or audio playback through Realtime was attempted.
- A future slice needs an actual server endpoint and browser WebRTC client behind explicit local configuration.

## Product Insight

Realtime voice should enter Blackstage as a governed stage capability, not as a raw browser model socket. The broker contract is the control point for identity, safety, transcripts, tool calls, and cost policy.

## AI-Building Insight

Typed readiness checks are useful before live provider work. They make missing safety inputs fail close to the contract, not later inside a voice session.

## Evidence

- `packages/voice-core/src/realtime/realtimeVoiceBroker.ts`
- `packages/voice-core/test/realtimeVoiceSession.test.mjs`
- `docs/21_agentic_harness_architecture.md`
