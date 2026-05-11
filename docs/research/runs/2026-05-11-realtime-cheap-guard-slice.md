# Realtime Cheap Guard Slice

Date: 2026-05-11

## What Was Attempted

Make the live Realtime smoke runner enforce the cheap-test contract before a provider exchange can start.

## Prompt Given To Codex

Continue the active Blackstage goal loop after the local `.env.local` key was added, and keep OpenAI Realtime testing cheap.

## What Codex Did Well

- Added a reusable Realtime live-smoke cheap guard.
- Capped runner timeout requests through a tested helper.
- Validated that the smoke offer carries an events data channel plus `recvonly` audio, and rejects SDP that can send browser audio before the broker/provider exchange.
- Added cheap-guard metadata to redacted proof packets without adding raw SDP, secrets, browser traces, or provider calls.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live OpenAI call, microphone prompt, or provider audio path was run.

## Product Insight

Live voice should earn trust by proving what it refuses to do. Rejecting browser-audio-send SDP before the provider exchange makes the first live test feel controlled instead of spooky.

## AI-Building Insight

Cheap testing should be executable policy, not just comments. A no-call guard keeps future autonomous slices from drifting into expensive or privacy-sensitive behavior.

## Evidence

- `scripts/realtime-live-smoke-cheap-guard.mjs`
- `scripts/smoke-realtime-live.mjs`
- `scripts/realtime-live-smoke-proof.mjs`
- `scripts/test/realtime-live-smoke-proof.test.mjs`
- `docs/23_realtime_live_smoke.md`
