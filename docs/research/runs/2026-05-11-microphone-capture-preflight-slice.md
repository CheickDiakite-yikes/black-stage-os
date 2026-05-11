# Microphone Capture Preflight Slice

Date: 2026-05-11

## What Was Attempted

Add a browser microphone capture readiness contract that advances the live voice path without starting a media stream or sending audio.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop after the object-control validation gate; choose the next safe action toward voice-native reality interface behavior without running live provider calls.

## What Codex Did Well

- Added a `voice-core` microphone preflight contract.
- Kept preflight side-effect-free: no media stream starts and no browser audio is sent to a provider.
- Required explicit user gesture, Realtime approval arming, and granted microphone permission before a start plan can exist.
- Added Node tests for blocked and ready microphone states.

## What Failed Or Needed Human Intervention

No human intervention was needed. No microphone permission prompt, live OpenAI Realtime call, or audio track was started.

## Product Insight

Voice-native work needs a visible safety ramp. A preflight contract lets Blackstage explain why live voice is not armed yet before asking for microphone access.

## AI-Building Insight

Separating readiness from capture avoids accidental provider work. The system can prove policy before creating media streams.

## Evidence

- `pnpm --filter @blackstage/voice-core test`
- `pnpm --filter @blackstage/voice-core typecheck`
- `pnpm lint`
- `pnpm scan:secrets`
